import { Notify, Dialog } from "quasar";

const useUtils = () => {
  /*---------------------------------------------------------*/
  // show notification
  /*---------------------------------------------------------*/
  // types: info | error
  const showNotify = (type, message) => {
    let notifyColor = type == "info" ? "teal-9" : "red-8";

    Notify.create({
      message: message,
      color: notifyColor,
    });
  };

  return { showNotify };
};

export default useUtils;
