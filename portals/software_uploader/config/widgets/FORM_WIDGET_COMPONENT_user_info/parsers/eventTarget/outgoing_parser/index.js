/**
* The 'parser' variable is the entry point for your parser. Write logic inside of the provided function and return a value
* Constants and utility functions can be created outside of the parser
* The provided ctx parameter is an object that contains data and model information on this item
* @param {context} ctx 
* @returns {rtn} */
parser = (ctx) => {

  
  const addAuthInfo = (portalsMeta, systemKey, name, email, authToken) => {
    const existingData = portalsMeta[systemKey] && {
      ...portalsMeta[systemKey][name],
    };
    return {
      ...portalsMeta,
      [systemKey]: {
        ...portalsMeta[systemKey],
        [name]: {
          ...existingData,
          email: email,
          authToken: authToken,
        },
      },
    };
  }

  const saveAuthInfo = (systemKey, portalName, email, authToken) => {
    const portalsMeta = JSON.parse(localStorage.getItem('cb_portals')) || {};
    const newMeta = addAuthInfo(portalsMeta, systemKey, portalName, email, authToken);
    localStorage.setItem('cb_portals', JSON.stringify(newMeta));
  }

  const createNotification = (msg) => {
    CB_PORTAL.createNotification({title: msg})
  }
  
  const data = ctx.widget.data;

  return new Promise((resolve, reject) => {
    if (data.new_password === data.confirm_password) {
      CB_PORTAL.ClearBlade.User().setPassword(data.old_password, data.new_password, (err, cb) => {
        if(err) {
          console.log('error: ', cb);
          let errMsg = cb;
          const errObj = JSON.parse(cb);

          if(errObj.error && errObj.error.detail) {
            errMsg = errObj.error.detail
          }

          resolve({success: false, results: errMsg});
          return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const systemKey = urlParams.get('systemKey');
        const systemSecret = urlParams.get('systemSecret');
        const portalName = urlParams.get('name');
        $.ajax('/console-api/portal/init/user', {
          data: JSON.stringify({
            email: data.email,
            password: data.new_password,
            systemKey: systemKey,
            systemSecret: systemSecret
          }),
          method: 'POST'
        }).then(resp => {
          CB_PORTAL.ClearBlade.setUser(data.email, resp.userToken);
          saveAuthInfo(systemKey, portalName, data.email, resp.userToken);
          createNotification('Password has been updated');
          CB_PORTAL.Modals.close('user_info')
          resolve({success: true})
        });
      });
    } else {
      resolve({ success: false, results: 'Passwords do not match.' });
    }
  });
}