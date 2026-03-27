import { useEffect, useState } from 'react';
import { getModal, SLUG_SHOP, mainURL, dev, prod, mainURLprod } from '../assets';
import JSZip from 'jszip';

export default function LoadForOne() {
  const [files, setFiles] = useState([]);
  const [zipName, setZipName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleZipUpload = async e => {
    try {
      const zipfile = e.target.files[0];
      if (!zipfile) return;

      setZipName(zipfile.name);
      setLoading(true);

      const zip = await JSZip.loadAsync(zipfile);
      const fileInside = Object.values(zip.files).filter(item => !item.dir);
      const extractedFiles = await Promise.all(
        fileInside.map(async file => {
          const blob = await file.async('blob');
          return new File([blob], file.name, { type: blob.type || 'application/octet-stream' });
        }),
      );

      setFiles(extractedFiles);
      setLoading(false);
      getModal('success', `Loaded ${extractedFiles.length} files from ZIP`);
    } catch (e) {
      getModal('error', 'Please upload ZIP file!');
      setZipName('');
      setFiles([]);
      setLoading(false);
      return;
    }
  };

  useEffect(() => {
    if (files.length === 0) return;

    const processFiles = async () => {
      const filesBySlug = {};

      for (const file of files) {
        const match = file.name.match(/^([A-Z]{2,4})_(desktop|mobile)/i);
        if (!match) continue;

        const slug = match[1].toUpperCase();
        const deviceType = match[2].toLowerCase();

        if (!filesBySlug[slug]) filesBySlug[slug] = {};
        filesBySlug[slug][deviceType] = file; // we keep the real File, not the base64, to transfer to the content script and read there, to avoid memory issues in case of big files
      }

      const processData = [];

      for (const slug of Object.keys(filesBySlug)) {
        let targetSlugs = slug === 'DEAT' ? ['DE', 'AT'] : [slug];

        for (const targetSlug of targetSlugs) {
          const shopIds = SLUG_SHOP[targetSlug];

          if (!shopIds) {
            console.warn(`Shop ID not found for: ${targetSlug}`);
            continue;
          }

          const shopList = Array.isArray(shopIds) ? shopIds : [shopIds];

          shopList.forEach(shopId => {
            processData.push({
              name: `${slug}_${shopId}`,
              url: window.location.origin === dev ? `${mainURL}${shopId}` : `${mainURLprod}${shopId}`,
              slug: targetSlug,
              files: filesBySlug[slug], // keeping the real File, not base64
            });
          });
        }
      }

      if (processData.length === 0) {
        getModal('error', 'No valid files found in ZIP');
        return;
      }

      getModal('success', `ZIP loaded successfully! ${processData.length} banners will be processed.`);

      setTimeout(() => {
        chrome.runtime.sendMessage(
          {
            action: 'processTabsSequentially',
            data: processData,
          },
          response => {
            if (response?.status === 'started') {
              console.log(`Started processing ${processData.length} tabs`);
              getModal('success', `Processing ${processData.length} banners...`);
            }
          },
        );
      }, 1200);
    };

    processFiles();
  }, [files]);

  return (
    <div className="load-for-one">
      <label className="Documents-btn">
        <input type="file" accept=".zip,.rar,.7z" style={{ display: 'none' }} onChange={handleZipUpload} />
        <span className="folderContainer">
          <svg
            className="fileBack"
            width="146"
            height="113"
            viewBox="0 0 146 113"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 4C0 1.79086 1.79086 0 4 0H50.3802C51.8285 0 53.2056 0.627965 54.1553 1.72142L64.3303 13.4371C65.2799 14.5306 66.657 15.1585 68.1053 15.1585H141.509C143.718 15.1585 145.509 16.9494 145.509 19.1585V109C145.509 111.209 143.718 113 141.509 113H3.99999C1.79085 113 0 111.209 0 109V4Z"
              fill="url(#paint0_linear_117_4)"
            />
            <defs>
              <linearGradient
                id="paint0_linear_117_4"
                x1="0"
                y1="0"
                x2="72.93"
                y2="95.4804"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#8F88C2" />
                <stop offset="1" stopColor="#5C52A2" />
              </linearGradient>
            </defs>
          </svg>
          <svg
            className="filePage"
            width="88"
            height="99"
            viewBox="0 0 88 99"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="88" height="99" fill="url(#paint0_linear_117_6)" />
            <defs>
              <linearGradient id="paint0_linear_117_6" x1="0" y1="0" x2="81" y2="160.5" gradientUnits="userSpaceOnUse">
                <stop stopColor="white" />
                <stop offset="1" stopColor="#686868" />
              </linearGradient>
            </defs>
          </svg>
          <svg
            className="fileFront"
            width="160"
            height="79"
            viewBox="0 0 160 79"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0.29306 12.2478C0.133905 9.38186 2.41499 6.97059 5.28537 6.97059H30.419H58.1902C59.5751 6.97059 60.9288 6.55982 62.0802 5.79025L68.977 1.18034C70.1283 0.410771 71.482 0 72.8669 0H77H155.462C157.87 0 159.733 2.1129 159.43 4.50232L150.443 75.5023C150.19 77.5013 148.489 79 146.474 79H7.78403C5.66106 79 3.9079 77.3415 3.79019 75.2218L0.29306 12.2478Z"
              fill="url(#paint0_linear_117_5)"
            />
            <defs>
              <linearGradient
                id="paint0_linear_117_5"
                x1="38.7619"
                y1="8.71323"
                x2="66.9106"
                y2="82.8317"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#C3BBFF" />
                <stop offset="1" stopColor="#51469A" />
              </linearGradient>
            </defs>
          </svg>
        </span>
        <p className="text">{loading ? 'Loading...' : zipName ? zipName : 'Load ZIP'}</p>
      </label>
    </div>
  );
}
