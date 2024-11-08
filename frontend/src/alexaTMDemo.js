import { HostObject } from "@amazon-sumerian-hosts/babylon";
import { Scene } from "@babylonjs/core/scene";
import DemoUtils from "./demo-utils";
import { cognitoIdentityPoolId, apiEndPoint } from "./demo-credentials.js";
//import { cognitoIdentityPoolId, apiEndPoint, cognitoClientID, cognitoUserPool } from "./demo-credentials.js"; //auth line
import axios from 'axios';
//import { AuthenticationDetails, CognitoUserPool, CognitoUser } from 'amazon-cognito-identity-js'; //auth line
import { AuthenticationDetails, CognitoUser } from 'amazon-cognito-identity-js';
import { 
  notEmpty, speranding, msgVolverPreguntarButton, v1,
  errorGeneral, error4xxMessage, msg4xxError, param1
 } from './messages-es-mx.js'; //messages that will show in the screen

let host;
let scene;
let userInput;

let timer;

let messageContainerEl;
let transcriptTextEl;
let idUserToken = "";
let hasTouchScreen = false;

//auth lines
/*const poolData = {
  UserPoolId: cognitoUserPool,
  ClientId: cognitoClientID
};*/

const userPool = null; 
//const userPool  new CognitoUserPool(poolData); //auth line
let cognitoUser;

const domEls = {
  username: document.getElementById('floatingUsername') || {},
  password: document.getElementById('floatingPassword') || {}
};

const parseJwt = token => {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace('-', '+').replace('_', '/');
  return JSON.parse(window.atob(base64));
};

const getVal = inVal => domEls[inVal].value || '';


async function createScene() {
  // Create an empty scene. Note: Sumerian Hosts work with both
  // right-hand or left-hand coordinate system for babylon scene
  scene = new Scene();

  const { shadowGenerator } = DemoUtils.setupSceneEnvironment(scene);
  initUi();

  // ===== Configure the AWS SDK =====

  const region = cognitoIdentityPoolId.split(":")[0];
  AWS.config.region = region;
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: cognitoIdentityPoolId,
  });

  // ===== Instantiate the Sumerian Host =====

  // Edit the characterId if you would like to use one of
  // the other pre-built host characters. Available character IDs are:
  // "Cristine", "Fiona", "Grace", "Maya", "Jay", "Luke", "Preston", "Wes"
  const characterId = "Cristine";
  //const characterId = "CHARACTERID_VAR";
  const pollyConfig = { pollyVoice: "Kajal", pollyEngine: "neural" };
  //const pollyConfig = { pollyVoice: "POLLY_VOICEID_VAR", pollyEngine: "neural" };
  const characterConfig = HostObject.getCharacterConfig(
    "./assets/character-assets",
    characterId
  );
  host = await HostObject.createHost(scene, characterConfig, pollyConfig);

  // Tell the host to always look at the camera.
  host.PointOfInterestFeature.setTarget(scene.activeCamera);

  // Enable shadows.
  scene.meshes.forEach((mesh) => {
    shadowGenerator.addShadowCaster(mesh);
  });
  
  return scene;
}

function initUi() {
  document.getElementById("startButton").onclick = () => startMainExperience();
  document.getElementById("speakButton").onclick = speak.bind(this);
  // Create convenience references to DOM elements.
  messageContainerEl = document.getElementById("userMessageContainer");
  transcriptTextEl = document.getElementById("transcriptText");

  const signInForm = document.getElementById('sign-in-form');
  signInForm.addEventListener('submit', event => {
    signInForm.classList.add('was-validated');
    event.preventDefault();
    event.stopPropagation();
    if (signInForm.checkValidity())
      signIn();
  }, false);

  showUiScreen("chatbotUiScreen");
  document.getElementById("speechText").value = v1;
  displaySpeechInputTranscript(v1);
  isMobile();
}

/**
 * Triggered when the user clicks the initial "start" button.
 */
function startMainExperience() {
  showUiScreen("chatbotUiScreen");
  // Speak a greeting to the user.
  host.TextToSpeechFeature.play(v1);
}

/**
 * Makes the specified UI screen visible and hides all other UI screens.
 * @param {string} id HTMLElement id of the screen to display.
 */
function showUiScreen(id) {
  document.querySelectorAll("#uiScreens .screen").forEach((element) => {
    const isTargetScreen = element.id === id;
    setElementVisibility(element.id, isTargetScreen);
  });
}

/**
 * Shows or hides an HTML element.
 * @param {string} id HTMLElement id
 * @param {boolean} visible `true` shows the element. `false` hides it.
 */
function setElementVisibility(id, visible) {
  const element = document.getElementById(id);
  if (visible) {
    element.classList.remove("hide");
  } else {
    element.classList.add("hide");
  }
}

/**
 * Add Sign In, default not auth is configured 
 */
const signIn = () => {
  console.log('Sign In');
  const authenticationDetails = new AuthenticationDetails(
    { Username: getVal('username'), Password: getVal('password') }
  );

  cognitoUser = new CognitoUser({ Username: getVal('username'), Pool: userPool });
  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: (result) => {
      console.log("onSuccess");
      idUserToken = cognitoUser.signInUserSession.idToken.jwtToken;
      showUiScreen("chatbotUiScreen");
    },

    onFailure: (err) => {
      alert(err.message || JSON.stringify(err, null, 2), 'danger');
    },

    totpRequired: function (codeDeliveryDetails) {
      console.log('mfaRequired:', codeDeliveryDetails);
      const verificationCode = prompt('Please input second factor code:', '');
      cognitoUser.sendMFACode(verificationCode, this, 'SOFTWARE_TOKEN_MFA');
    },
  });
}

/**
 * Method to invoke the endpoint that invoke Bedrock Knowledge Base and get the response
 * If you need sessionId you can get it from first response and pass it as a parameter to the endpoint
 * @idUserToken is the token obtained from the authentication process
 * @returns 
 */
async function speak() {
  hideUserMessages();
  document.getElementById("speakButton").textContent = msgVolverPreguntarButton;

  userInput = document.getElementById("speechText").value;

  document.getElementById("speechText").value = '';

  if (userInput === "") {
    host.TextToSpeechFeature.play(notEmpty);
    displaySpeechInputTranscript(notEmpty);
    document.getElementById("speechText").value = "";
    document.getElementById("speakButton").disabled = false;
    return;
  }

  var sessionId = "";
  const params = {
    input: userInput,
    sessionId: sessionId,
    paramName: param1
  }
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": 'application/json',
    'Authorization': idUserToken
  }

  displayProcessingMessage();
  try {
    host.TextToSpeechFeature.play(speranding);
    // Invoke the endpoint.
    const response = await axios.post(apiEndPoint,
                                      params,
                                      { headers: headers });
    const speech = response.data.output.text;
    sessionId = response.data.sessionId;
    hideProcessingMessage();
    displaySpeechInputTranscript(speech);
    await host.TextToSpeechFeature.play(speech);

  } catch (err) {
    console.error(err, err.stack);
    if(err.code == msg4xxError){
      host.TextToSpeechFeature.play(error4xxMessage);
    }else{
      host.TextToSpeechFeature.play(errorGeneral);
    }
    hideProcessingMessage();
  }
  document.getElementById("speechText").value = "";
  document.getElementById("speakButton").disabled = false;
  resetTimer();

}

function resetTimer() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    hideUserMessages();
  }, 120000); // 120000 milisegundos = 2 minutos
}

function isMobile(){
  if ("maxTouchPoints" in navigator) {
    hasTouchScreen = navigator.maxTouchPoints > 0;
  } else if ("msMaxTouchPoints" in navigator) {
      hasTouchScreen = navigator.msMaxTouchPoints > 0;
  } else {
      var mQ = window.matchMedia && matchMedia("(pointer:coarse)");
      if (mQ && mQ.media === "(pointer:coarse)") {
          hasTouchScreen = !!mQ.matches;
      } else if ('orientation' in window) {
          hasTouchScreen = true; // deprecated, but good fallback
      } else {
          // Only as a last resort, fall back to user agent sniffing
          var UA = navigator.userAgent;
          hasTouchScreen = (
              /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA) ||
              /\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA)
          );
      }
  }
}

function displaySpeechInputTranscript(text) {
  transcriptTextEl.innerText = `“${text}”`;
  messageContainerEl.classList.add("showingMessage");
}

function displayProcessingMessage() {
  messageContainerEl.classList.add("processing");
}

function hideProcessingMessage() {
  messageContainerEl.classList.remove("processing");
}

function hideUserMessages() {
  messageContainerEl.classList.remove("showingMessage");
}

DemoUtils.loadDemo(createScene);