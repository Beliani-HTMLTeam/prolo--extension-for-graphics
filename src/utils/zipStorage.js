import JSZip from "jszip";

const DB_NAME = 'ZipStorage';
const DB_VERSION = 1;
const STORE_NAME = 'zipFiles';

let db = null;

function openDatabase() { 
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    }

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

export async function saveZipToStorage(zipFile) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME);

    // Store as Blob directly
    const request = store.put(zipFile, "currentZip")

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  })
}

export async function getZipFromStorage() {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get("currentZip")

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  })
}

export async function clearZipStorage() {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete('currentZip')

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  })
}

export async function extractFileFromZip(fileName) {
  const zipBlob = await getZipFromStorage();
  if (!zipBlob) return null

  const zip = await JSZip.loadAsync(zipBlob);
  const file = zip.file(fileName)

  if (!file) return null;

  const blob = await file.async("blob");
  return new File([blob], fileName, {type: blob.type || 'application/octet-stream'});
}

export async function getZipFileList() {
  const zipBlob = await getZipFromStorage()
  if (!zipBlob) return []

  const zip = await JSZip.loadAsync(zipBlob);
  return Object.values(zip.files).filter(item => !item.dir).map(item => item.name);
}