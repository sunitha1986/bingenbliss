const config = {
  API_BASE_URL: import.meta.env.DEV
    ? `http://${window.location.hostname}:4000`
    : window.location.origin,
};

//production build will use the same origin as the frontend, so we can just use window.location.origin
// const config = {
//   API_BASE_URL: "https://bingenbliss.vasmigroup.com/",
// };

export const getImageUrl = (url) => {
  if (!url) return "";
  const normalizedUrl = url.replace(/\\/g, "/");
  if (normalizedUrl.startsWith("http")) return normalizedUrl;
  return `${config.API_BASE_URL}${normalizedUrl.startsWith("/") ? "" : "/"}${normalizedUrl}`;
};

export default config;
