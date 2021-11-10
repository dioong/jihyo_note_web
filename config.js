const env = process.env.ENVIRONMENT || "dev";

const config = {
  local: {
    api: "http://localhost/api",
  },
  dev: {
    api: "http://localhost/api",
  },
  stage: {
    api: "http://localhost/api",
  },
  prod: {
    api: "http://localhost/api",
  },
};

module.exports = config[env];
