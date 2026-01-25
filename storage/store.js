// storage/store.js
import fs from "fs";

export function loadJson(filePath, fallback){
  try{
    if(!fs.existsSync(filePath)) return fallback;
    const txt = fs.readFileSync(filePath, "utf-8");
    if(!txt.trim()) return fallback;
    return /.parse(txt);
  }catch{
    return fallback;
  }
}

export function saveJson(filePath, data){
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export function nowIso(){
  return new Date().toISOString();
}
