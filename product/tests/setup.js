// src/test/setup.js
import { jest } from "@jest/globals";

// 🔥 Mock ImageKit (IMPORTANT)
jest.unstable_mockModule("imagekit", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      upload: jest.fn().mockResolvedValue({
        url: "https://fake-image-url.com/image.jpg",
        fileId: "fake_file_id",
      }),
    })),
  };
});

// 🔥 Optional: console clean
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
};