import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import './AddressSearchModal.css';

export default function AddressSearchModal({ visible, onSelect, onClose }) {
  useEffect(() => {
    if (!visible) return;
    if (!window.isKakaoReady || !window.kakao?.maps?.services?.Geocoder) {
      console.warn('❗ Kakao SDK 아직 준비 안 됨, 잠시만 기다려주세요.');
      return;
    }

    const loadPostcodeScript = () => {
      return new Promise((resolve) => {
        const existingScript = document.querySelector('script[src*="postcode.v2.js"]');
        if (existingScript) {
          existingScript.onload = resolve;
          return resolve();
        }

        const script = document.createElement('script');
        script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
        script.onload = resolve;
        document.body.appendChild(script);
      });
    };

    loadPostcodeScript().then(() => {
      new window.daum.Postcode({
        oncomplete: (data) => {
          const address = data.address;

          if (!window.kakao?.maps?.services?.Geocoder) {
            console.error('Geocoder가 로드되지 않았습니다.');
            return;
          }

          const geocoder = new window.kakao.maps.services.Geocoder();
          geocoder.addressSearch(address, (results, status) => {
            if (status === window.kakao.maps.services.Status.OK) {
              const { y: latitude, x: longitude } = results[0];
              onSelect({ address, latitude, longitude });
              onClose();
            } else {
              console.error('Geocoder 주소 변환 실패:', status);
            }
          });
        },
        onclose: onClose,
      }).embed(document.getElementById('postcode-container'));
    });

    return () => {
      const c = document.getElementById('postcode-container');
      if (c) c.innerHTML = '';
    };
  }, [visible, onSelect, onClose]);

  if (!visible) return null;

  return ReactDOM.createPortal(
    <div className="address-search-backdrop" onClick={onClose}>
      <div className="postcode-modal" onClick={(e) => e.stopPropagation()}>
        <div id="postcode-container" style={{ width: '100%', height: '100%' }} />
      </div>
    </div>,
    document.body
  );
}
