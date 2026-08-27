/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bat source map cho bundle production (mac dinh Next.js tat de giam
  // kich thuoc build). Khong co source map, loi client-side trong production
  // chi hien duoc dong chung chung nhu "Cannot read properties of undefined
  // (reading 'length')" - khong biet file/dong nao, rat kho chan doan tu
  // bao cao cua user. Bat len de Console/DevTools map nguoc ve dung ten
  // file + so dong trong source goc (TypeScript/TSX), doi lai la bundle
  // .js.map duoc public kem theo (nguoi dung cuoi van khong thay duoc gi
  // khac biet, chi anh huong ai mo DevTools chu dong).
  productionBrowserSourceMaps: true
};

export default nextConfig;
