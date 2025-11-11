import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function YandexMetrika() {
  const location = useLocation();

  useEffect(() => {
    
    if (!window.ym) {
      const script = document.createElement("script");
      script.src = "https://mc.yandex.ru/metrika/tag.js";
      script.async = true;
      document.head.appendChild(script);

      window.ym = function () {
        (window.ym.a = window.ym.a || []).push(arguments);
      };
      window.ym.l = 1 * new Date();

      window.ym(105250468, "init", {
        webvisor: true,
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
      });

     
      const noscript = document.createElement("noscript");
      noscript.innerHTML = `
        <div><img src="https://mc.yandex.ru/watch/105250468" style="position:absolute; left:-9999px;" alt="" /></div>
      `;
      document.body.appendChild(noscript);
    }
  }, []);

  
  useEffect(() => {
    if (window.ym) {
      window.ym(105250468, "hit", location.pathname);
      console.log("Yandex.Metrika hit:", location.pathname);
    }
  }, [location]);

  return null; 
}
