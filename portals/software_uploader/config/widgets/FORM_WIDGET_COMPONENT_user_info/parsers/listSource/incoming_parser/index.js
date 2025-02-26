
/* 
  * @param {context} ctx 
  * @returns {rtn} 
  */
parser = (ctx) => {

  const widgetData = {
    data: {
      email: CB_PORTAL.ClearBlade.user.email
    },
  }
  return {
    widgetData
  };
}
      