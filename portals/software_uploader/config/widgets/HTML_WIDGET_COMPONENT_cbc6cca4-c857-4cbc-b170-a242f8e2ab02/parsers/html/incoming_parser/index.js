//JavaScript
/**
* The 'parser' variable is the entry point for your parser. Write logic inside of the provided function and return a value
* Constants and utility functions can be created outside of the parser
* The provided ctx parameter is an object that contains data and model information on this item
* @param {context} ctx 
* @returns {rtn} */

const IA_COMPONENT_NAME = "daum"
const BUCKET_NAME = "devicemanager-files";
const BUCKET_API_PATH = "/api/v/4/bucket_sets/{systemKey}/{bucketSetName}/file/create"
const FILE_PATH = "components/" + IA_COMPONENT_NAME + "/firmware/{device_type}/{version}";

function populateDeviceTypes() {
    if(datasources["asset_types"].lastUpdated) {
        var deviceTypes = datasources["asset_types"].latestData();

        $("#device-types").empty();

        //Add a blank option
        $("#device-types").append('<option value=""></option>');

        if (deviceTypes && deviceTypes.length > 0) {
            $("#no-device-types-error").hide();
            $("#device-types").removeClass('error');

            datasources["asset_types"].incomingData.forEach(function(assetType){
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

function deviceTypeIsValid() {
    if ($('#device-types').find(":selected").val()) {
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
    if ($('#software-name').val()) {
        $("#software-name").removeClass('error');
        $("#software-name-error").hide();

        return true;
    } else {
        $("#software-name").addClass('error');
        $("#software-name-error").show();

        return false;
    } 
}

function versionIsValid() {
    //Add regular expression test
    var semverRegEx = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-((?:0|[1-9][0-9]*|[0-9]*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9][0-9]*|[0-9]*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

    if ($('#version').val() && semverRegEx.test($('#version').val())) {
        $("#version").removeClass('error');
        $("#version-error").hide();

        return true;
    } else {
        $("#version").addClass('error');
        $("#version-error").show();

        return false;
    } 
}

function fileNameIsValid() {
    id="file-name"

    if ($('#file-name').val()) {
        $("#file-name").removeClass('error');
        $("#filename-error").hide();

        return true;
    } else {
        $("#file-name").addClass('error');
        $("#filename-error").show();

        return false;
    } 
}

function allFieldsAreValid() {
    return deviceTypeIsValid() && softwareNameIsValid() && versionIsValid() && fileNameIsValid();
}

function readFile(file) {
    return new Promise(function (resolve, reject){
        var reader = new FileReader();

        reader.onload = (evt) => {
            if (typeof evt.target.result === 'string') {
                var contents = evt.target.result.slice(evt.target.result.indexOf(',') + 1);

                resolve(contents);
            } else {
                reject(new Error("File contents not read correctly"));
            }
        };

        reader.readAsDataURL(file);
    })
}


function createFileInBucket(fileSpec) {
    return new Promise(function (resolve, reject) {

        var uriPath = BUCKET_API_PATH
            .replace("{systemKey}", CB_PORTAL.ClearBlade.systemKey)
            .replace("{bucketSetName}", BUCKET_NAME);

        var url = CB_PORTAL.ClearBlade.URI + uriPath;

        var urlbody = {
            "box": "sandbox",
            "path": fileSpec.file_path + "/" + fileSpec.file_name,
            "contents": fileSpec.contents
        };

        fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "ClearBlade-UserToken": CB_PORTAL.ClearBlade.user.authToken,
            },
            body: JSON.stringify(urlbody)
        })
        .then(function (response) {
            if (!response.ok) {
                reject(new Error(`Response status: ${response.status}`));
            }
            resolve(response.json());
        })
        .catch(function (error) {
            reject(error);
        });
    });
}

function createFilesRowInDB(fileSpec) {
    return new Promise(function (resolve, reject) {
        //Create row in collection
        datasources["software_versions"].sendData({
            "data": {
                "device_type": fileSpec.device_type,
                "name": fileSpec.software_name,
                "version": fileSpec.version,
                "file_name": fileSpec.file_name,
                "file_path": fileSpec.file_path,
                "upload_date": fileSpec.upload_date,
                "upload_user": fileSpec.upload_user
            },
            "method": "INSERT"
        })
        .then(function(results) {
            resolve(results);
        })
        .catch(function(error) {
            reject(error);
        });
    });
}

function saveFile () {
    var fileInput = $('#file-name')[0];

    if (fileInput && fileInput.files[0]) {
        var fileSpec = {
            "device_type": $('#device-types').find(":selected").val(),
            "software_name": $('#software-name').val(),
            "version": $('#version').val(),
            "file_name": fileInput.files[0].name,
            "file_path": "",
            "upload_date": new Date().toISOString(),
            "upload_user": CB_PORTAL.ClearBlade.user.email,
            "contents": ""
        };

        fileSpec.file_path = FILE_PATH
            .replace("{device_type}", fileSpec.device_type)
            .replace("{version}", fileSpec.version);

        //Read the file contents
        readFile(fileInput.files[0])
        .then(function (fileContents) {
            fileSpec.contents = fileContents;


            return createFileInBucket(fileSpec);
        })
        .then(function (results) {
            //Create a row in the software_versions collection
            return createFilesRowInDB(fileSpec);
        })
        .then(function() {
            CB_PORTAL.Modals.open("file-uploaded");
            resetFormFields();
        })
        .catch(function(error) {
            console.log("Error saving file:");
            console.log(JSON.stringify(error));
        });
    }
}


function handleSaveBtnClick() {
    if (allFieldsAreValid()) {
        //Save file data
        saveFile();
    }
}

function resetFormFields() {
    $("#no-device-types-error").hide();
    $("#device-types").removeClass('error');

    $("#device-types").removeClass('error');
    $("#device-type-reqd-error").hide(); 

    $("#software-name").removeClass('error');
    $("#software-name-error").hide();

    $("#version").removeClass('error');
    $("#version-error").hide();

    $("#file-name").removeClass('error');
    $("#filename-error").hide();
}

parser = (ctx) => {
    datasources["asset_types"].refresh();
    resetFormFields();

    //datasources["asset_types"].latestData.unsubscribe(populateDeviceTypes)
    datasources["asset_types"].latestData.subscribe(populateDeviceTypes)
	
    $('#save-btn').off('click');
    $('#save-btn').click(handleSaveBtnClick);
  
}
