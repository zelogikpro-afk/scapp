const XLSX = require('C:/Users/Zineb Eddaqaqi/success-compass/node_modules/xlsx');

const wb = XLSX.readFile("C:/Users/Zineb Eddaqaqi/Downloads/Test_d'Intelligence_Émotionnell2026-06-14_07_41_28.xlsx");
const ws = wb.Sheets[wb.SheetNames[0]];
const jfRows = XLSX.utils.sheet_to_json(ws, { defval: '' });

// DB records ordered by created_at ASC (oldest first = matches JotForm row order)
const dbRecords = [
  {id:'958c1df6-3187-4200-980f-f23b88e9193a'},
  {id:'bee3b0b0-0811-44fc-b4f3-aff9f99bc8ee'},
  {id:'47388859-3112-4750-89c9-7e9b5531f4c3'},
  {id:'31c7ad42-8455-46e9-8a2d-bcfd94dfc9ec'},
  {id:'aca3b034-bcdd-4e97-b32c-e89cfa782199'},
  {id:'30f590c9-b3dc-4a25-8459-b82e1a4bfef2'},
  {id:'5a10b5f1-75c9-4ed8-a898-6ca606b699b7'},
  {id:'6d8d9964-2001-41d4-89a8-7fcfc4874b42'},
  {id:'8705f4c8-333e-48a6-9a6b-070c5b7c4525'},
  {id:'cee53134-2bb4-4a5f-b428-861f4746b066'},
  {id:'2189632b-92d0-4e5e-b279-83e41365fe08'},
  {id:'b55ea49b-c47c-4494-b348-073ffdf48ff4'},
  {id:'9bcf1040-21c9-44ec-8fc0-f82113520967'},
  {id:'75a5b94d-11d1-4e62-9434-43880d902374'},
  {id:'b158cad9-d3e2-40d9-b773-ece69b3cfdf8'},
  {id:'e07957b1-f629-44f8-b726-9ecf9cafc6ea'},
  {id:'91b3bd04-fd99-41ec-bbd6-0a7f4dd4bc54'},
  {id:'1051e694-ce0e-47e2-a822-55cf2d07e396'},
  {id:'22e2329f-60e9-414c-845e-5bf894a1bc93'},
  {id:'7104617e-d75c-47d4-a60c-0295d56897d0'},
  {id:'a356d378-1e65-4c6e-a93e-34616e35a9bd'},
  {id:'9d0da730-b1b6-4025-8be9-7c1e09e48e74'},
  {id:'32f0c639-ab22-4960-a808-ae02c0f56db9'},
  {id:'02182216-affc-44fb-a635-1962f17848be'},
  {id:'7dc8f0dc-b645-4ca4-b8cd-d5be166dbfdf'},
  {id:'e7af0f96-c88d-472e-b2fe-19df84177dc0'},
  {id:'90be443d-ee19-4d36-b3ee-3b972e55e9bc'},
  {id:'f1a11b38-62ed-4bd7-8505-d8dcdba3972e'},
  {id:'aec4aec0-b384-4a3f-b9e6-be5b3a3d1fbf'},
  {id:'8da9e7d7-fe70-4d8e-a3e7-c6a97ace0399'},
  {id:'c35ffb69-2926-44a2-bd3e-d283243d1c2a'},
  {id:'3946eb42-3140-4a06-bddc-fbadd400d1cb'},
  {id:'ef3eff3b-2529-455e-89dc-49d6313c7bad'},
  {id:'a300e48c-5eb5-493d-9893-1a2bf88bc55c'},
  {id:'f8001061-68a3-4d37-a094-12398962d8dc'},
  {id:'54591ba4-4a17-48b5-86f9-ed88ccee447e'},
  {id:'418eff30-a39d-4341-aea8-02fc509bf060'},
  {id:'fe160a23-b2af-4cf8-a043-5fd4fd1ecf1f'},
  {id:'230ad36a-fff8-43c0-9fc9-2fe27d811925'},
  {id:'f387c542-ea55-4f61-8407-3ce1d9b41f2b'},
  {id:'8ca032a8-06cb-48ad-9e0e-2935a8ed81c8'},
  {id:'27b6e58c-42e5-4dd9-87dc-b01093972692'},
  {id:'b647e1ee-59f3-49a8-99ae-42789fa846e8'},
  {id:'170de8c9-976c-41c9-9212-47bbfa476ece'},
  {id:'43ce38b6-9636-479f-a328-5f6cc982d22c'},
  {id:'3584bcc5-ad44-40bc-ad74-5b0ca1e0ddf2'},
  {id:'03dcd4af-8881-46fd-9321-19cb920920a1'},
  {id:'503c25c0-c6a7-4413-934b-3e48f7939359'},
  {id:'3f59f929-8178-4036-9ea9-c7c702e0a761'},
  {id:'957a5baa-4b28-4780-8fe5-0a0357fa9170'},
  {id:'cf52b982-9733-4db0-a95b-c323cd91ebdf'},
  {id:'cbea096e-22f1-4382-98f3-39552b5d0f75'},
  {id:'61ae9e5e-59d3-4a87-8b63-21db1aabc5ae'},
  {id:'0a905466-37bd-41bc-a9d8-a7c44e964f08'},
  {id:'1a0dedec-fe11-4301-9689-1dcb4eb754ee'},
  {id:'4a9cdaba-e94f-428c-881f-73b2592586c3'},
  {id:'6859802b-d027-4ea1-82d6-796feee322bb'},
  {id:'d43066a9-382f-4711-ae27-2f5afc3c2734'},
  {id:'a3eba0f0-a7d5-4fd6-9ca8-82d61c95520c'},
  {id:'f5d6ef4f-8cc0-4f0b-8a85-8b18e4dfc46f'},
  {id:'1e57d137-a73f-4e50-bd52-e08f4bd46f1c'},
  {id:'f00cf048-5d76-47fa-afb1-fc45e8e2febc'},
  {id:'5e913b5f-5c20-4c27-a340-bde3e8ca26b3'},
  {id:'61447164-eef4-4cf3-856f-b95da2b0f0b2'},
  {id:'2a39bf11-3dd9-416e-b652-b4e3f7fc1606'},
  {id:'5107dda0-8a54-470b-b2d2-90152dfafb0a'},
  {id:'c9d9da27-abbb-4c26-a26e-9cab90642e7c'},
  {id:'74ca09b2-3b06-4b3e-bbf0-81b623794186'},
  {id:'161c66b8-abbc-499e-bb96-5e70f2a877ba'},
];

const months = { 'janv.':1,'févr.':2,'mars':3,'avr.':4,'mai':5,'juin':6,'juil.':7,'août':8,'sept.':9,'oct.':10,'nov.':11,'déc.':12 };

function parseDate(d) {
  const parts = d.trim().split(' ');
  const month = months[parts[0]];
  const day = parseInt(parts[1].replace(',',''));
  const year = parseInt(parts[2]);
  return new Date(Date.UTC(year, month-1, day, 12, 0, 0)).toISOString();
}

const lines = dbRecords.map((rec, i) => {
  const jf = jfRows[i];
  if (!jf) return null;
  const rawDate = jf['Submission Date'];
  const date = parseDate(rawDate);
  const name = jf['Nom et Prénom'];
  return `UPDATE test_results SET created_at = '${date}' WHERE id = '${rec.id}'; -- ${name} | ${rawDate}`;
}).filter(Boolean);

const sql = lines.join('\n');
require('fs').writeFileSync('C:/Users/Zineb Eddaqaqi/success-compass/scripts/ie-dates.sql', sql);
console.log('Generated', lines.length, 'UPDATE statements');
console.log('First few:');
lines.slice(0,5).forEach(l => console.log(l));
