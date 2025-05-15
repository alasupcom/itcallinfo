// import { useEffect, useRef } from 'react';
// import '../../public/Browser-Phone/BrowserPhone';

// function PhonePage() {
//   const phoneRef = useRef<HTMLElement>(null);

//   useEffect(() => {
//     const phoneElement = phoneRef.current;

//     if (phoneElement) {
//       phoneElement.addEventListener('connected', () => {
//         console.log('BrowserPhone connected!');
//       });
//     }

//     return () => {
//       if (phoneElement) {
//         phoneElement.removeEventListener('connected', () => { });
//       }
//     };
//   }, []);

//   return (
//     <div>
//       {/* ts-ignore */}
//       <browser-phone
//       // style="width: 100%; height: 100vh;"
//         server="demo.itcallinfo.info"
//         websocketPort={8089}
//         websocketPath="/ws"
//         sipUsername="7052"
//         sipPassword="jhIPERCOMc36c961326f0U"
//         displayName="test call"
//         domain="demo.itcallinfo.info"
//         ref={phoneRef}
//       >
//       </browser-phone>
//     </div>
//   );
// }

// export default PhonePage;