self.__WB_MANIFEST;

self.addEventListener("install", (event) => {
    console.log("Service Worker installed in development mode");
  });
  
self.addEventListener("fetch", (event) => {
    console.log("Intercepted fetch request for:", event.request.url);
  });