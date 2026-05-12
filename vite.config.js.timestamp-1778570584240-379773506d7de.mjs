// vite.config.js
import { defineConfig } from "file:///c:/Users/c00ar/OneDrive/Desktop/Projelerim/S%C4%B1nav%20Gonderme%20platformu/node_modules/vite/dist/node/index.js";
import react from "file:///c:/Users/c00ar/OneDrive/Desktop/Projelerim/S%C4%B1nav%20Gonderme%20platformu/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///c:/Users/c00ar/OneDrive/Desktop/Projelerim/S%C4%B1nav%20Gonderme%20platformu/node_modules/@tailwindcss/vite/dist/index.mjs";
import obfuscator from "file:///c:/Users/c00ar/OneDrive/Desktop/Projelerim/S%C4%B1nav%20Gonderme%20platformu/node_modules/rollup-plugin-javascript-obfuscator/dist/rollup-plugin-javascript-obfuscator.cjs.js";
var vite_config_default = defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
    // Sadece build aşamasında çalışan kod karıştırıcı (obfuscator)
    command === "build" && obfuscator({
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 1,
      numbersToExpressions: true,
      simplify: true,
      stringArrayThreshold: 1,
      splitStrings: true,
      splitStringsChunkLength: 5,
      unicodeEscapeSequence: false
    })
  ],
  build: {
    sourcemap: false,
    // F12'de orijinal kodun gözükmesini engeller
    minify: "terser",
    // Daha agresif küçültme
    terserOptions: {
      compress: {
        drop_console: true,
        // Console logları temizler
        drop_debugger: true
      }
    }
  },
  server: {
    host: "0.0.0.0",
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    watch: {
      ignored: ["**/src/uploads_student/**"]
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true
      },
      "/uploads": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
        secure: false
      },
      "/socket.io": {
        target: "http://127.0.0.1:3001",
        ws: true,
        changeOrigin: true
      },
      "/polyos-socket": {
        target: "http://127.0.0.1:3001",
        ws: true,
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 80,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true
      },
      "/uploads": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
        secure: false
      },
      "/socket.io": {
        target: "http://127.0.0.1:3001",
        ws: true,
        changeOrigin: true
      },
      "/polyos-socket": {
        target: "http://127.0.0.1:3001",
        ws: true,
        changeOrigin: true
      }
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJjOlxcXFxVc2Vyc1xcXFxjMDBhclxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXFByb2plbGVyaW1cXFxcU1x1MDEzMW5hdiBHb25kZXJtZSBwbGF0Zm9ybXVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcImM6XFxcXFVzZXJzXFxcXGMwMGFyXFxcXE9uZURyaXZlXFxcXERlc2t0b3BcXFxcUHJvamVsZXJpbVxcXFxTXHUwMTMxbmF2IEdvbmRlcm1lIHBsYXRmb3JtdVxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vYzovVXNlcnMvYzAwYXIvT25lRHJpdmUvRGVza3RvcC9Qcm9qZWxlcmltL1MlQzQlQjFuYXYlMjBHb25kZXJtZSUyMHBsYXRmb3JtdS92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcclxuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gJ0B0YWlsd2luZGNzcy92aXRlJ1xyXG5pbXBvcnQgb2JmdXNjYXRvciBmcm9tICdyb2xsdXAtcGx1Z2luLWphdmFzY3JpcHQtb2JmdXNjYXRvcidcclxuXHJcbi8vIGh0dHBzOi8vdml0ZS5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgY29tbWFuZCB9KSA9PiAoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICB0YWlsd2luZGNzcygpLFxyXG4gICAgLy8gU2FkZWNlIGJ1aWxkIGFcdTAxNUZhbWFzXHUwMTMxbmRhIFx1MDBFN2FsXHUwMTMxXHUwMTVGYW4ga29kIGthclx1MDEzMVx1MDE1RnRcdTAxMzFyXHUwMTMxY1x1MDEzMSAob2JmdXNjYXRvcilcclxuICAgIGNvbW1hbmQgPT09ICdidWlsZCcgJiYgb2JmdXNjYXRvcih7XHJcbiAgICAgIGNvbXBhY3Q6IHRydWUsXHJcbiAgICAgIGNvbnRyb2xGbG93RmxhdHRlbmluZzogdHJ1ZSxcclxuICAgICAgY29udHJvbEZsb3dGbGF0dGVuaW5nVGhyZXNob2xkOiAxLFxyXG4gICAgICBudW1iZXJzVG9FeHByZXNzaW9uczogdHJ1ZSxcclxuICAgICAgc2ltcGxpZnk6IHRydWUsXHJcbiAgICAgIHN0cmluZ0FycmF5VGhyZXNob2xkOiAxLFxyXG4gICAgICBzcGxpdFN0cmluZ3M6IHRydWUsXHJcbiAgICAgIHNwbGl0U3RyaW5nc0NodW5rTGVuZ3RoOiA1LFxyXG4gICAgICB1bmljb2RlRXNjYXBlU2VxdWVuY2U6IGZhbHNlXHJcbiAgICB9KVxyXG4gIF0sXHJcbiAgYnVpbGQ6IHtcclxuICAgIHNvdXJjZW1hcDogZmFsc2UsIC8vIEYxMidkZSBvcmlqaW5hbCBrb2R1biBnXHUwMEY2elx1MDBGQ2ttZXNpbmkgZW5nZWxsZXJcclxuICAgIG1pbmlmeTogJ3RlcnNlcicsIC8vIERhaGEgYWdyZXNpZiBrXHUwMEZDXHUwMEU3XHUwMEZDbHRtZVxyXG4gICAgdGVyc2VyT3B0aW9uczoge1xyXG4gICAgICBjb21wcmVzczoge1xyXG4gICAgICAgIGRyb3BfY29uc29sZTogdHJ1ZSwgLy8gQ29uc29sZSBsb2dsYXJcdTAxMzEgdGVtaXpsZXJcclxuICAgICAgICBkcm9wX2RlYnVnZ2VyOiB0cnVlXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogJzAuMC4wLjAnLFxyXG4gICAgcG9ydDogcHJvY2Vzcy5lbnYuUE9SVCA/IHBhcnNlSW50KHByb2Nlc3MuZW52LlBPUlQpIDogNTE3MyxcclxuICAgIHdhdGNoOiB7XHJcbiAgICAgIGlnbm9yZWQ6IFsnKiovc3JjL3VwbG9hZHNfc3R1ZGVudC8qKiddXHJcbiAgICB9LFxyXG4gICAgcHJveHk6IHtcclxuICAgICAgJy9hcGknOiB7XHJcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovLzEyNy4wLjAuMTozMDAxJyxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICAgICcvdXBsb2Fkcyc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vMTI3LjAuMC4xOjMwMDEnLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxyXG4gICAgICB9LFxyXG4gICAgICAnL3NvY2tldC5pbyc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vMTI3LjAuMC4xOjMwMDEnLFxyXG4gICAgICAgIHdzOiB0cnVlLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZVxyXG4gICAgICB9LFxyXG4gICAgICAnL3BvbHlvcy1zb2NrZXQnOiB7XHJcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovLzEyNy4wLjAuMTozMDAxJyxcclxuICAgICAgICB3czogdHJ1ZSxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWVcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgcHJldmlldzoge1xyXG4gICAgcG9ydDogODAsXHJcbiAgICBwcm94eToge1xyXG4gICAgICAnL2FwaSc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vMTI3LjAuMC4xOjMwMDEnLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgfSxcclxuICAgICAgJy91cGxvYWRzJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly8xMjcuMC4wLjE6MzAwMScsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXHJcbiAgICAgIH0sXHJcbiAgICAgICcvc29ja2V0LmlvJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly8xMjcuMC4wLjE6MzAwMScsXHJcbiAgICAgICAgd3M6IHRydWUsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlXHJcbiAgICAgIH0sXHJcbiAgICAgICcvcG9seW9zLXNvY2tldCc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vMTI3LjAuMC4xOjMwMDEnLFxyXG4gICAgICAgIHdzOiB0cnVlLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59KSlcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFrWixTQUFTLG9CQUFvQjtBQUMvYSxPQUFPLFdBQVc7QUFDbEIsT0FBTyxpQkFBaUI7QUFDeEIsT0FBTyxnQkFBZ0I7QUFHdkIsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxRQUFRLE9BQU87QUFBQSxFQUM1QyxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUE7QUFBQSxJQUVaLFlBQVksV0FBVyxXQUFXO0FBQUEsTUFDaEMsU0FBUztBQUFBLE1BQ1QsdUJBQXVCO0FBQUEsTUFDdkIsZ0NBQWdDO0FBQUEsTUFDaEMsc0JBQXNCO0FBQUEsTUFDdEIsVUFBVTtBQUFBLE1BQ1Ysc0JBQXNCO0FBQUEsTUFDdEIsY0FBYztBQUFBLE1BQ2QseUJBQXlCO0FBQUEsTUFDekIsdUJBQXVCO0FBQUEsSUFDekIsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFdBQVc7QUFBQTtBQUFBLElBQ1gsUUFBUTtBQUFBO0FBQUEsSUFDUixlQUFlO0FBQUEsTUFDYixVQUFVO0FBQUEsUUFDUixjQUFjO0FBQUE7QUFBQSxRQUNkLGVBQWU7QUFBQSxNQUNqQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNLFFBQVEsSUFBSSxPQUFPLFNBQVMsUUFBUSxJQUFJLElBQUksSUFBSTtBQUFBLElBQ3RELE9BQU87QUFBQSxNQUNMLFNBQVMsQ0FBQywyQkFBMkI7QUFBQSxJQUN2QztBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2hCO0FBQUEsTUFDQSxZQUFZO0FBQUEsUUFDVixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsTUFDVjtBQUFBLE1BQ0EsY0FBYztBQUFBLFFBQ1osUUFBUTtBQUFBLFFBQ1IsSUFBSTtBQUFBLFFBQ0osY0FBYztBQUFBLE1BQ2hCO0FBQUEsTUFDQSxrQkFBa0I7QUFBQSxRQUNoQixRQUFRO0FBQUEsUUFDUixJQUFJO0FBQUEsUUFDSixjQUFjO0FBQUEsTUFDaEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2hCO0FBQUEsTUFDQSxZQUFZO0FBQUEsUUFDVixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsTUFDVjtBQUFBLE1BQ0EsY0FBYztBQUFBLFFBQ1osUUFBUTtBQUFBLFFBQ1IsSUFBSTtBQUFBLFFBQ0osY0FBYztBQUFBLE1BQ2hCO0FBQUEsTUFDQSxrQkFBa0I7QUFBQSxRQUNoQixRQUFRO0FBQUEsUUFDUixJQUFJO0FBQUEsUUFDSixjQUFjO0FBQUEsTUFDaEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
