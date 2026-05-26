import { useEffect, useState } from 'react';
import { checkedDeviceType, filledCashback, COUNTRY_CASHBACK, COUNTRY_CODE, getCurrentShop } from '../assets';
import { getModal } from '../assets';
import ChooseZipBtn from './ChooseZipBtn';
import JSZip from 'jszip';

export default function LoadZipButton() {
  const [files, setFiles] = useState([]);
  const [mobileFiles, setMobilesFiles] = useState(null);
  const [cashbackMobile, setCashbackMobile] = useState(null);
  const [desktopFiles, setDesktopFiles] = useState(null);
  const [zipName, setZipName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const modernMobile = [];

    const form = document.querySelector('form.banner-form');
    const input = form.querySelectorAll('input[type="file"][name^=pic][size="30"]');
    const mobile_input = form.querySelectorAll('input[type="file"][name^=mobile_pic][size="30"]');

    const cashbackMobile = Array.from(mobile_input);
    const half = cashbackMobile.length / 2;
    const secondHalf = Array.from(cashbackMobile.slice(half));

    setCashbackMobile(secondHalf);
    setDesktopFiles(Array.from(input));

    mobile_input.forEach((item, index) => {
      if (index > 16) {
        return modernMobile.push(item);
      }
    });
    setMobilesFiles(Array.from(modernMobile));
  }, []);

  const handleZipUpload = async e => {
    try {
      const zipfile = e.target.files[0];
      if (!zipfile) return;

      setZipName(zipfile.name);

      const zip = await JSZip.loadAsync(zipfile);
      const fileInside = Object.values(zip.files).filter(item => !item.dir);
      const extractedFiles = await Promise.all(
        fileInside.map(async file => {
          const blob = await file.async('blob');
          return new File([blob], file.name, { type: blob.type || 'application/octet-stream' });
        }),
      );

      setFiles(extractedFiles);
    } catch (e) {
      getModal('error', 'Please upload ZIP file!');
      setZipName('');
      setFiles([]);
      return;
    }
  };

useEffect(() => {
    if (files.length === 0) return;

    setLoading(true);

    const processFiles = () => {
      try {
        const currentShop = getCurrentShop();

        const hasCashback = files.some(file => file.name.split('_').length > 2);
        const hasDEAT = files.some(f => f.name.toUpperCase().startsWith('DEAT_'));
        const hasCHDE = files.some(f => f.name.toUpperCase().startsWith('CHDE_'));
        const hasDACH = files.some(f => f.name.toUpperCase().startsWith('DACH_'));

        console.log(`[Priority] Current Shop: ${currentShop} | DEAT:${hasDEAT}, CHDE:${hasCHDE}, DACH:${hasDACH}`);

        for (const item of files) {
          const upperName = item.name.toUpperCase();

          if (hasCashback) {
            filledCashback(item, desktopFiles, currentShop);
            filledCashback(item, cashbackMobile, currentShop);
            continue;
          }

          // ==================== PRIORITY LOGIC ====================
          let assigned = false;

          // 1. Highest priority: DEAT for DE/AT
          if (upperName.startsWith('DEAT_') && ['DE', 'AT'].includes(currentShop)) {
            console.log(`→ Assigning DEAT file to ${currentShop}`);
            checkedDeviceType(item, 'desktop', desktopFiles);
            checkedDeviceType(item, 'mobile', mobileFiles);
            assigned = true;
          }

          // 2. Highest priority: CHDE for CH
          else if ((upperName.startsWith('CHDE_') || upperName.startsWith('CH_')) && currentShop === 'CH') {
            console.log(`→ Assigning CHDE/CH file to CH`);
            checkedDeviceType(item, 'desktop', desktopFiles);
            checkedDeviceType(item, 'mobile', mobileFiles);
            assigned = true;
          }

          // 3. DACH as fallback
          else if (upperName.startsWith('DACH_')) {
            const shouldUseDACH = 
              (currentShop === 'CH' && !hasCHDE) ||
              (currentShop === 'DE' && !hasDEAT) ||
              (currentShop === 'AT' && !hasDEAT);

            if (shouldUseDACH) {
              console.log(`→ Using DACH as fallback for ${currentShop}`);
              checkedDeviceType(item, 'desktop', desktopFiles);
              checkedDeviceType(item, 'mobile', mobileFiles);
              assigned = true;
            }
          }

          // 4. Normal shops
          else if (!assigned) {
            console.log(`→ Normal assignment for ${upperName}`);
            checkedDeviceType(item, 'desktop', desktopFiles);
            checkedDeviceType(item, 'mobile', mobileFiles);
          }
        }

        getModal('nyan', `Files added! ${hasCashback ? 'Cashback' : 'Regular'}`);
      } catch (e) {
        console.error(e);
        getModal('cryMen', 'Error assigning files');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(processFiles, 1000);
    return () => clearTimeout(timer);
  }, [files, desktopFiles, mobileFiles, cashbackMobile]);

  return (
    <div className="zip__wrapper">
      <ChooseZipBtn handleZipUpload={handleZipUpload} zipName={zipName} loading={loading} />
    </div>
  );
}
