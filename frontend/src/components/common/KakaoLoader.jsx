import { useEffect, useState } from 'react';

export default function useKakaoLoader() {
  const [sdkLoaded, setSdkLoaded] = useState(false);

  useEffect(() => {
    const loadKakaoSdk = () => {
      return new Promise((resolve) => {
        if (window.kakao?.maps?.services) {
          console.log('✅ Kakao SDK 이미 로드됨');
          return resolve();
        }

        const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');
        if (existingScript) {
          existingScript.addEventListener('load', () => {
            window.kakao.maps.load(resolve);
          });
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=76d35304f2cbc0619c0024e8f209970a&autoload=false&libraries=services';
        script.onload = () => {
          window.kakao.maps.load(resolve);
        };
        document.head.appendChild(script);
      });
    };

    loadKakaoSdk().then(() => {
      console.log('✅ Kakao Maps SDK 로딩 완료 (공통)');
      window.isKakaoReady = true;
      setSdkLoaded(true);
    });
  }, []);

  return sdkLoaded;
}
