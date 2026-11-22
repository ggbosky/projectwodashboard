// Vloží ikonu a popis do .exe (náhrada za rcedit, který na Linuxu potřebuje Wine).
import fs from 'node:fs';
import * as ResEdit from 'resedit';

const [exePath, icoPath, version] = process.argv.slice(2);
const exe = ResEdit.NtExecutable.from(fs.readFileSync(exePath), { ignoreCert: true });
const res = ResEdit.NtExecutableResource.from(exe);
const ico = ResEdit.Data.IconFile.from(fs.readFileSync(icoPath));
const groups = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);
const groupId = groups.length ? groups[0].id : 1;
const lang = groups.length ? groups[0].lang : 1033;
ResEdit.Resource.IconGroupEntry.replaceIconsForResource(res.entries, groupId, lang, ico.icons.map((i) => i.data));

const [vi] = ResEdit.Resource.VersionInfo.fromEntries(res.entries);
const [a, b, c] = version.split('.').map(Number);
vi.setFileVersion(a, b, c, 0, 1033);
vi.setProductVersion(a, b, c, 0, 1033);
vi.setStringValues({ lang: 1033, codepage: 1200 }, {
  CompanyName: 'Project Two',
  FileDescription: 'Project Two CRM',
  ProductName: 'Project Two CRM',
  InternalName: 'Project Two CRM',
  OriginalFilename: 'Project Two CRM.exe',
  LegalCopyright: 'Project Two',
  FileVersion: version,
  ProductVersion: version,
});
vi.outputToResourceEntries(res.entries);
res.outputResource(exe);
fs.writeFileSync(exePath, Buffer.from(exe.generate()));
console.log('icon + version info set');
