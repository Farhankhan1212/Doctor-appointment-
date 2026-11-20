import { jwtDecode } from "jwt-decode";

const getUserInfo = (token) => {
  if (token) {
    const data = jwtDecode(token);
    return data;
  }
  return null;
};

export default getUserInfo;