import { ActionTypes } from "../types";

const INITIAL_STATE = {
  connection: "Connect Wallet",
};

const connectReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ActionTypes.CONNECT:
      return {
        ...state,
        connection: action.payload,
      };
    default:
      return state;
  }
};
export default connectReducer;
