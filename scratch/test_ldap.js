import ldap from 'ldapjs';

const client = ldap.createClient({
  url: 'ldap://127.0.0.1:389'
});

client.bind('cn=admin,dc=liderahenk,dc=org', '1', (err) => {
  if (err) {
    console.error('Bind Error:', err);
    client.unbind();
    return;
  }
  console.log('Bind Success!');

  const searchOptions = {
    filter: '(uid=*)',
    scope: 'sub',
    attributes: ['dn', 'cn', 'sn', 'mail', 'uid', 'givenName', 'displayName']
  };

  client.search('dc=liderahenk,dc=org', searchOptions, (err, res) => {
    if (err) {
      console.error('Search Error:', err);
      client.unbind();
      return;
    }

    res.on('searchEntry', (entry) => {
      console.log('--- FOUND ENTRY ---');
      console.log('Keys on entry:', Object.keys(entry));
      console.log('entry.object:', entry.object);
      console.log('entry.attributes:', entry.attributes.map(a => `${a.type}=${a.values}`));
    });

    res.on('error', (err) => {
      console.error('Res Error:', err);
      client.unbind();
    });

    res.on('end', (result) => {
      console.log('Search End');
      client.unbind();
    });
  });
});
