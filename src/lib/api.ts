import axios from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_FORECAST_API_BASE_URL?.trim() ||
  "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL,
  timeout: 20000,
  paramsSerializer: {
    serialize(params) {
      const search = new URLSearchParams();

      Object.entries(params ?? {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          return;
        }

        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (item !== undefined && item !== null && item !== "") {
              search.append(key, String(item));
            }
          });
          return;
        }

        search.append(key, String(value));
      });

      return search.toString();
    },
  },
});

