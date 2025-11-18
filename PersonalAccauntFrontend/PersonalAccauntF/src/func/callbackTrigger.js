let callbackFunction = null;

export const registerCallbackTrigger = (fn) => {
  callbackFunction = fn;
};

export const triggerCallback = () => {
  if (callbackFunction) callbackFunction();
};
