import ldap from 'ldapjs';

const client = ldap.createClient({
  url: 'ldap://192.168.1.11:389',
  timeout: 5000,
  connectTimeout: 5000
});

client.on('error', (err) => {
  console.log('Client Error:', err.message);
});

console.log('Binding...');
client.bind('cn=admin,dc=liderahenk,dc=org', '1', (err) => {
  if (err) {
    console.error('Bind Error:', err.message);
    client.unbind();
    return;
  }
  console.log('Bind Success! Searching...');

  const searchOptions = {
    filter: '(uid=*)',
    scope: 'sub',
    attributes: ['dn', 'cn', 'sn', 'mail', 'uid']
  };

  client.search('dc=liderahenk,dc=org', searchOptions, (err, res) => {
    if (err) {
      console.error('Search Error:', err.message);
      client.unbind();
      return;
    }

    res.on('searchEntry', (entry) => {
      console.log('--- FOUND ENTRY ---');
      console.log('DN:', entry.objectName);
      
      let obj = entry.object;
      console.log('Has entry.object?', !!obj);
      if (obj) console.log('entry.object:', obj);
      
      console.log('Attributes:');
      if (entry.attributes) {
        entry.attributes.forEach(a => {
          console.log(`  ${a.type}: vals=${JSON.stringify(a.vals)}, values=${JSON.stringify(a.values)}`);
        });
      }
    });

    res.on('error', (err) => {
      console.error('SearchResult Error:', err.message);
      client.unbind();
    });

    res.on('end', (result) => {
      console.log('Search End. Result status:', result.status);
      client.unbind();
    });
  });
});
