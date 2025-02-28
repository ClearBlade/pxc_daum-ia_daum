//JavaScript
/**
* The 'parser' variable is the entry point for your parser. Write logic inside of the provided function and return a value
* Constants and utility functions can be created outside of the parser
* The provided ctx parameter is an object that contains data and model information on this item
* @param {context} ctx 
* @returns {rtn} */

const IA_COMPONENT_NAME = "daum";
const SOFTWARE_UPDATE_TOPIC = "devices/software/update";

function populateDeviceTypes() {
    if(datasources["asset_types"].lastUpdated) {
        var deviceTypes = datasources["asset_types"].latestData();
        $("#device-types").empty();

        //Add a blank option
        $("#device-types").append('<option value=""></option>');

        if (deviceTypes && deviceTypes.length > 0) {
            $("#no-device-types-error").hide();
            $("#device-types").removeClass('error');

            deviceTypes.forEach(function(assetType){
                if (assetType.data.device_type) {
                    $("#device-types").append(
                        '<option value="' + 
                        assetType.data.device_type +
                        '">' + 
                        assetType.data.label +
                        '</option>');
                }
            });
        } else {
            $("#device-types").addClass('error');
            $("#no-device-types-error").show();
        }
    }
}

function populateSoftwareNames() {
    if(datasources["software_names"].lastUpdated) {
        var swNames = datasources["software_names"].latestData();
        $("#install-name").empty();

        //Add a blank option
        $("#install-name").append('<option value=""></option>');

        $("#no-install-names-error").hide();
        $("#install-name-error").hide();
        $("#install-name").removeClass('error');

        if (swNames && swNames.length > 0) {
            var distinctNames = {};

            //Construct a distinct list of software names
            swNames.forEach(function(name){
                if (name.data.name) {
                    distinctNames[name.data.name] = name.data.name;
                }
            });

            Object.keys(distinctNames).forEach(function (key) {
                $("#install-name").append(
                        '<option value="' + 
                        key +
                        '">' + 
                        key +
                        '</option>');
            });
        } else {
            if ($('#device-types').val()) {
                $("#install-name").addClass('error');
                $("#no-install-names-error").show();
            }
        }
    }
}

function populateSoftwareVersions() {
    if(datasources["software_versions"].lastUpdated) {
        var swVersions = datasources["software_versions"].latestData();

        $("#install-version").empty();

        //Add a blank option
        $("#install-version").append('<option value=""></option>');

        if (swVersions && swVersions.length > 0) {
            $("#install-version").removeClass('error');

            swVersions.forEach(function(version){
                if (version.data.version) {
                    $("#install-version").append(
                        '<option value="' + 
                        version.data.version +
                        '">' + 
                        version.data.version +
                        '</option>');
                }
            });
        }
    }
}

function populateAssets() {
    $('input:checkbox').off('change');

    if(datasources["assets"].lastUpdated) {
        $("#assets-table-body").empty();

        var assets = datasources["assets"].latestData();

        if (assets.length > 0) {
            $('#assets-table').show();
            $('#no-devices-msg').hide();

            assets.forEach(function(asset) {
                // Create a new row with data 
                var newRow = 
                '<tr>' + 
                    '<td>' + 
                        '<input type="checkbox" id="' + asset.data.id + 
                        '" name="' + asset.data.id + '">' +
                    '</td>' + 
                    '<td>' + asset.data.label + '</td>' + 
                '</tr>'; 
                 
                // Append the new row to the table body 
                $('#assets-table-body').append(newRow);

                //Add the checkbox event listener
                $('input:checkbox').change(handleCheckboxChange);
            });
        } else {
            $('#assets-table').hide();
            $('#no-devices-msg').show();
        }
    }
}

function populateCurrentlyInstalled() {
    if(datasources["device_software_installed"].lastUpdated) {
        $("#install-table-body").empty();

        var installs = datasources["device_software_installed"].latestData();
        var assets = datasources["assets"].latestData();

        if (installs.length > 0) {
            $('#install-table').show();
            $('#no-installs-msg').hide();


            installs.forEach(function(install) {
                // Create a new row with data 
                var asset = assets.find(function(asset) {
                    return asset.data.id = install.data.asset_id;
                });

                var newRow = 
                '<tr>' + 
                    '<td>' + asset.data.label + '</td>' + 
                    '<td>' + install.data.installation_date + '</td>' + 
                    '<td>' + install.data.user_id + '</td>' + 
                    '<td>' + install.data.version + '</td>' + 
                '</tr>'; 
                 
                // Append the new row to the table body 
                $('#install-table-body').append(newRow);
            });
        } else {
            $('#install-table').hide();
            $('#no-installs-msg').show();
        }
    }
}

function populateScheduledInstalls() {
    if(datasources["device_software_scheduled"].lastUpdated) {
        $("#schedule-table-body").empty();

        var schedules = datasources["device_software_scheduled"].latestData();
        var assets = datasources["assets"].latestData();

        if (schedules.length > 0) {
            $('#schedule-table').show();
            $('#no-schedules-msg').hide();

            schedules.forEach(function(schedule) {
                // Create a new row with data 
                var asset = assets.find(function(asset) {
                    return asset.data.id = schedule.data.asset_id;
                });

                var newRow = 
                '<tr>' + 
                    '<td>' + asset.data.label + '</td>' + 
                    '<td>' + new Date(schedule.data.installation_date).toLocaleString() + '</td>' + 
                    '<td>' + schedule.data.status.toUpperCase() + '</td>' + 
                    '<td>' + schedule.data.status + '</td>' + 
                '</tr>'; 
                 
                // Append the new row to the table body 
                $('#schedule-table-body').append(newRow);

                //Add the checkbox event listener
                $('input:checkbox').change(handleCheckboxChange);
            });
        } else {
            $('#schedule-table').hide();
            $('#no-schedules-msg').show();
        }
    }
}

function deviceTypeIsValid() {
    if ($('#device-types').val()) {
        $("#device-types").removeClass('error');
        $("#device-type-reqd-error").hide();

        return true;
    } else {
        $("#device-types").addClass('error');
        $("#device-type-reqd-error").show();

        return false;
    }
}

function softwareNameIsValid() {
    if ($('#install-name').val()) {
        $("#install-name").removeClass('error');
        $("#install-name-error").hide();

        return true;
    } else {
        $("#install-name").addClass('error');
        $("#install-name-error").show();

        return false;
    }
}

function softwareVersionIsValid() {
    if ($('#install-version').val()) {
        $("#install-version").removeClass('error');
        $("#install-version-error").hide();

        return true;
    } else {
        $("#install-version").addClass('error');
        $("#install-version-error").show();

        return false;
    }
}

function allFieldsAreValid() {
    return deviceTypeIsValid() && softwareNameIsValid() && softwareVersionIsValid();
}

function handleCheckboxChange(event) {
    if ($(this).attr('id')  === 'select-all') {
        $('input:checkbox').not($(this)).prop('checked', $(this).prop('checked'));
    }
}

function handleSubmitBtnClick() {
    if (allFieldsAreValid()) {
        var msgPayload = {
            "softwareName": $('#install-name').val(),
            "version": $('#install-version').val(),
            "install_timestamp": new Date($('#install-timestamp').val()).toISOString(),
            "userId": CB_PORTAL.ClearBlade.user.email,
            "assets": []
        }

        //Get all checked checkboxes in the table body
        console.log($('#assets-table-body input:checkbox:checked'));

        //$('input:checkbox').not($(this)).prop('checked', $(this).prop('checked'));

        $('#assets-table-body input:checkbox:checked').each(function(item) {
            msgPayload.assets.push($( this ).attr('id'));
        })

        if (msgPayload.assets.length > 0) {
            //Publish the payload to SOFTWARE_UPDATE_TOPIC
            console.debug("Payload being published");
            console.debug(msgPayload);

            datasources["InstallSoftware"].sendData(JSON.stringify(msgPayload));
        }
    }
}

function handleDeviceTypeChange(event) {
    //Clear the options for software name and software versions
    $("#install-name").empty();
    $("#install-version").empty();

    //Retrieve all assets and software names for device type
    datasources["assets"].sendData({
        "query": CB_PORTAL.ClearBlade.Query().equalTo("type", $("#device-types").val())
    });

    datasources["software_names"].sendData({
        "query": CB_PORTAL.ClearBlade.Query().equalTo("device_type", $("#device-types").val())
    });
}

function handleSoftwareNameChange(event) {
    //Clear the options for software versions
    $("#install-version").empty();

    datasources["software_versions"].sendData({
        "query": CB_PORTAL.ClearBlade.Query()
            .equalTo("device_type", $("#device-types").val())
            .equalTo("name", $("#install-name").val())
            .descending('version')
    });

    datasources["device_software_installed"].sendData({
        "query": CB_PORTAL.ClearBlade.Query()
            .equalTo("software_descriptor", $("#install-name").val())
            .equalTo("status", "complete")
            .ascending('asset_id')
            .descending('version')
    });

    datasources["device_software_scheduled"].sendData({
        "query": CB_PORTAL.ClearBlade.Query()
            .equalTo("software_descriptor", $("#install-name").val())
            .equalTo("status", "pending")
            .ascending('asset_id')
            .descending('version')
    });
}

function handleSoftwareVersionChange(event) {
    var selectedVersion = $("#install-version").val()

    datasources["software_versions"].latestData().forEach(function(version) {
        if (version.data.version === selectedVersion) {
            $('#filename').val(version.data.file_name);
        }
    });
}

function resetFormFields() {
    $("#no-device-types-error").hide();
    $("#device-type-reqd-error").hide(); 
    $("#device-types").removeClass('error');
    

    $("#install-name").removeClass('error');
    $("#install-name-error").hide();
    $("#no-install-names-error").hide();

    $("#install-version").removeClass('error');
    $("#install-version-error").hide();
    $("#no-install-versions-error").hide();

    $('#no-devices-msg').show();
    $('#assets-table').hide();
    $('#install-table').hide();
    $('#schedule-table').hide();

    const now = new Date();
    $('#install-timestamp').val(
        now.getFullYear() + '-' + 
        String(now.getMonth() + 1).padStart(2, '0') + "-" +
        String(now.getDate()).padStart(2, '0') + "T" + 
        String(now.getHours()).padStart(2, '0') + ":" +
        String(now.getMinutes()).padStart(2, '0')
    );
}

parser = (ctx) => {
    datasources["asset_types"].refresh();
    resetFormFields();

    //Subscribe to datasource updates
    datasources["asset_types"].latestData.subscribe(populateDeviceTypes);
    datasources["assets"].latestData.subscribe(populateAssets);
    datasources["software_names"].latestData.subscribe(populateSoftwareNames);
	datasources["software_versions"].latestData.subscribe(populateSoftwareVersions);
    datasources["device_software_installed"].latestData.subscribe(populateCurrentlyInstalled);
	datasources["device_software_scheduled"].latestData.subscribe(populateScheduledInstalls);

    //Add event listeners
    $('#device-types').off('change');
    $('#device-types').on('change', handleDeviceTypeChange);

    $('#install-name').off('change');
    $('#install-name').on('change', handleSoftwareNameChange);

    $('#install-version').off('change');
    $('#install-version').on('change', handleSoftwareVersionChange);

    $('#submit-btn').off('click');
    $('#submit-btn').click(handleSubmitBtnClick);
  
}
