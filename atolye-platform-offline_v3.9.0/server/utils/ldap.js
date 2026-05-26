import ldap from 'ldapjs';

/**
 * LDAP Kimlik Doğrulama Servisi
 * @param {Object} config - LDAP konfigürasyonu (host, port, baseDN, etc.)
 * @param {string} username - Kullanıcı adı
 * @param {string} password - Şifre
 * @returns {Promise<Object>} - Kullanıcı bilgileri veya hata
 */
export const authenticateLDAP = (config, username, password) => {
  return new Promise((resolve, reject) => {
    const { url, baseDN, userDNPattern, searchFilter } = config;

    // Client oluştur
    const client = ldap.createClient({
      url: url || 'ldap://localhost:389',
      timeout: 5000,
      connectTimeout: 10000
    });

    client.on('error', (err) => {
      console.error('LDAP Client Error:', err);
      reject(new Error('LDAP sunucusuna bağlanılamadı.'));
    });

    // Kullanıcı DN'ini oluştur (örn: uid=username,ou=users,dc=liderahenk,dc=org)
    // Eğer userDNPattern verilmişse onu kullan, yoksa direkt DN oluşturmayı dene
    const userDN = userDNPattern 
      ? userDNPattern.replace('{{username}}', username)
      : `uid=${username},${baseDN}`;

    // Bind (Giriş yap)
    client.bind(userDN, password, (err) => {
      if (err) {
        client.unbind();
        console.error('LDAP Auth Bind Error:', err);
        if (err.name === 'InvalidCredentialsError') {
          return reject(new Error('Hatalı kullanıcı adı veya şifre.'));
        }
        const errorDetail = err.message || err.name || 'Bilinmeyen LDAP hatası';
        return reject(new Error('LDAP doğrulama hatası: ' + errorDetail + (err.code ? ` (Kod: ${err.code})` : '')));
      }

      // Giriş başarılı, kullanıcı bilgilerini ara (opsiyonel ama önerilir)
      if (searchFilter) {
        const filter = searchFilter.replace('{{username}}', username);
        const searchOptions = {
          filter: filter,
          scope: 'sub',
          attributes: ['dn', 'cn', 'sn', 'mail', 'givenName', 'displayName']
        };

        client.search(baseDN, searchOptions, (err, res) => {
          if (err) {
            client.unbind();
            return resolve({ username, dn: userDN }); // Arama hatası olsa da giriş başarılı sayılır
          }

          let foundUser = null;

          res.on('searchEntry', (entry) => {
            foundUser = entry.object;
          });

          res.on('error', (err) => {
            console.error('LDAP Search Error:', err);
            client.unbind();
            resolve({ username, dn: userDN });
          });

          res.on('end', () => {
            client.unbind();
            if (foundUser) {
              resolve({
                username: username,
                fullName: foundUser.displayName || foundUser.cn || `${foundUser.givenName} ${foundUser.sn}`,
                email: foundUser.mail,
                dn: foundUser.dn
              });
            } else {
              resolve({ username, dn: userDN });
            }
          });
        });
      } else {
        client.unbind();
        resolve({ username, dn: userDN });
      }
    });
  });
};

/**
 * LDAP Bağlantı Testi
 */
export const testLDAPConnection = (config) => {
  return new Promise((resolve, reject) => {
    const { url, bindDN, bindPassword } = config;

    const client = ldap.createClient({
      url: url || 'ldap://localhost:389',
      timeout: 5000,
      connectTimeout: 5000
    });

    client.on('error', (err) => {
      reject(new Error('Bağlantı hatası: ' + err.message));
    });

    // Admin/Bind kullanıcısı ile bağlanmayı dene
    client.bind(bindDN, bindPassword, (err) => {
      client.unbind();
      if (err) {
        console.error('LDAP Bind Full Error:', err);
        const errorDetail = err.message || err.name || 'Bilinmeyen LDAP hatası';
        return reject(new Error('LDAP Bind hatası: ' + errorDetail + (err.code ? ` (Kod: ${err.code})` : '')));
      }
      resolve({ success: true, message: 'Bağlantı başarılı!' });
    });
  });
};

/**
 * LDAP Kullanıcılarını Listele
 */
export const searchLDAPUsers = (config) => {
  return new Promise((resolve, reject) => {
    const { url, bindDN, bindPassword, baseDN, searchFilter } = config;

    const client = ldap.createClient({
      url: url || 'ldap://localhost:389',
      timeout: 10000,
      connectTimeout: 10000
    });

    client.on('error', (err) => {
      reject(new Error('LDAP Bağlantı hatası: ' + err.message));
    });

    client.bind(bindDN, bindPassword, (err) => {
      if (err) {
        client.unbind();
        return reject(new Error('LDAP Yönetici girişi başarısız: ' + err.message));
      }

      const users = [];
      // Ayarlardaki filtreyi baz al (örn: (uid={{username}}) -> (uid=*))
      const filter = searchFilter ? searchFilter.replace('{{username}}', '*') : '(uid=*)';
      
      const searchOptions = {
        filter: filter,
        scope: 'sub',
        attributes: ['dn', 'cn', 'sn', 'mail', 'uid', 'givenName', 'displayName', 'ou', 'title']
      };

      client.search(baseDN, searchOptions, (err, res) => {
        if (err) {
          client.unbind();
          return reject(new Error('LDAP Arama hatası: ' + err.message));
        }

        res.on('searchEntry', (entry) => {
          let obj = entry.object;
          
          if (!obj) {
            // Eğer entry.object tanımsızsa (bazı ldapjs sürümlerinde oluyor), özellikleri kendimiz çıkaralım
            obj = { dn: entry.objectName || '' };
            if (entry.attributes) {
              for (const attr of entry.attributes) {
                obj[attr.type] = Array.isArray(attr.values) ? attr.values[0] : (attr.vals ? attr.vals[0] : '');
              }
            }
          }
          
          // Halen boş bir dn veya uid var ise atla
          if (!obj.uid) return;

          users.push({
            uid: obj.uid || '',
            fullName: obj.displayName || obj.cn || `${obj.givenName || ''} ${obj.sn || ''}`.trim() || obj.uid || 'İsimsiz Kullanıcı',
            email: obj.mail || '',
            dn: obj.dn || entry.objectName || '',
            ou: obj.ou || '',
            title: obj.title || ''
          });
        });

        res.on('error', (err) => {
          client.unbind();
          reject(new Error('Arama sırasında hata: ' + err.message));
        });

        res.on('end', () => {
          client.unbind();
          resolve(users);
        });
      });
    });
  });
};

/**
 * Platform Kullanıcılarını LDAP'a Dışa Aktar
 */
export const exportToLDAP = (config, users) => {
  return new Promise((resolve, reject) => {
    const { url, bindDN, bindPassword, userDNPattern } = config;

    const client = ldap.createClient({
      url: url || 'ldap://localhost:389',
      timeout: 10000,
      connectTimeout: 10000
    });

    client.on('error', (err) => {
      reject(new Error('LDAP Bağlantı hatası: ' + err.message));
    });

    client.bind(bindDN, bindPassword, async (err) => {
      if (err) {
        client.unbind();
        return reject(new Error('LDAP Yönetici girişi başarısız: ' + err.message));
      }

      let successCount = 0;
      let errorList = [];

      for (const user of users) {
        try {
          const dn = userDNPattern.replace('{{username}}', user.uid);
          
          // Soyad için varsayılan fallback
          const nameParts = user.fullName ? user.fullName.split(' ') : [];
          const sn = nameParts.length > 1 ? nameParts.pop() : (user.fullName || user.uid);
          const cn = user.fullName || user.uid;
          const givenName = nameParts.join(' ') || sn;

          // OU ve Sınıf/Bölüm Ataması
          const isStudent = user.role === 'Öğrenci' || user.className;
          const ouVal = isStudent ? (user.className || 'Öğrenciler') : (user.department || 'Öğretmenler');
          const titleVal = isStudent ? 'Öğrenci' : 'Öğretmen';

          const newEntry = {
            objectClass: ['top', 'person', 'organizationalPerson', 'inetOrgPerson'],
            cn: cn,
            sn: sn,
            uid: user.uid,
            givenName: givenName,
            displayName: cn,
            ou: ouVal,
            title: titleVal
          };

          if (user.email) newEntry.mail = user.email;
          if (user.password) newEntry.userPassword = user.password; // Varsayılan/rastgele şifre veya raw şifre

          await new Promise((resAdd, rejAdd) => {
            client.add(dn, newEntry, (addErr) => {
              if (addErr) {
                // Eğer zaten varsa (Entry Already Exists 68), özellikleri güncelle
                if (addErr.code === 68) {
                  const modifyChanges = [
                    new ldap.Change({ operation: 'replace', modification: { type: 'ou', values: [ouVal] } }),
                    new ldap.Change({ operation: 'replace', modification: { type: 'title', values: [titleVal] } }),
                    new ldap.Change({ operation: 'replace', modification: { type: 'displayName', values: [cn] } }),
                    new ldap.Change({ operation: 'replace', modification: { type: 'givenName', values: [givenName] } }),
                    new ldap.Change({ operation: 'replace', modification: { type: 'sn', values: [sn] } })
                  ];
                  client.modify(dn, modifyChanges, (modifyErr) => {
                    if (modifyErr) {
                      rejAdd(new Error(`${user.uid} güncellenemedi: ${modifyErr.message}`));
                    } else {
                      successCount++;
                      resAdd();
                    }
                  });
                } else {
                   rejAdd(new Error(`${user.uid} eklenemedi: ${addErr.message}`));
                }
              } else {
                successCount++;
                resAdd();
              }
            });
          });

        } catch (addError) {
          errorList.push(addError.message);
        }
      }

      client.unbind();
      
      if (errorList.length > 0 && successCount === 0) {
        reject(new Error('Kullanıcılar aktarılamadı:\n' + errorList.join('\n')));
      } else {
        resolve({
          successCount,
          errors: errorList
        });
      }
    });
  });
};

/**
 * LDAP Kullanıcı Şifresini Güncelle
 */
export const updateLDAPPassword = (config, uid, newPassword) => {
  return new Promise((resolve, reject) => {
    const { url, bindDN, bindPassword, userDNPattern } = config;

    const client = ldap.createClient({
      url: url || 'ldap://localhost:389',
      timeout: 5000,
      connectTimeout: 5000
    });

    client.on('error', (err) => {
      reject(new Error('LDAP Bağlantı hatası: ' + err.message));
    });

    client.bind(bindDN, bindPassword, (err) => {
      if (err) {
        client.unbind();
        return reject(new Error('LDAP Yönetici girişi başarısız: ' + err.message));
      }

      const dn = userDNPattern.replace('{{username}}', uid);
      const change = new ldap.Change({
        operation: 'replace',
        modification: {
          type: 'userPassword',
          values: [newPassword]
        }
      });

      client.modify(dn, [change], (modifyErr) => {
        client.unbind();
        if (modifyErr) {
          reject(new Error(`Şifre LDAP'a yansıtılamadı: ${modifyErr.message}`));
        } else {
          resolve(true);
        }
      });
    });
  });
};
