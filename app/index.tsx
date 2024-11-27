import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Platform,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Keyboard, 
} from "react-native";
import { useFonts } from "expo-font";
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/FontAwesome';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppLoading from 'expo-app-loading'; 

const { width, height } = Dimensions.get('window');

export default function App() {
  const [fontsLoaded] = useFonts({
    "GaMaamli-Regular": require("../assets/fonts/GaMaamli-Regular.ttf"),
    "OpenSans-Regular": require("../assets/fonts/OpenSans-Regular.ttf"),
    "OpenSans-Bold": require("../assets/fonts/OpenSans-Bold.ttf"),
    "DelaGothicOne-Regular": require("../assets/fonts/DelaGothicOne-Regular.ttf"),
    'Lato-Bold': require('../assets/fonts/Lato-Bold.ttf')
  });

  const [username, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [showNoInternetModal, setShowNoInternetModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false); // Add this state

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      if (!state.isConnected) {
        setShowNoInternetModal(true);
      } else {
        setShowNoInternetModal(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => {
        setError('');
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [error]);

  // Add this useEffect to listen to keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  async function handleLogin() {
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    if (!isConnected) {
      setError('No internet connection.');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post('http://dts.sanjuancity.gov.ph/api/login', {
        username,
        password,
      });

      if (response.data && response.data.access_token) {
        const authToken = response.data.access_token;

        await AsyncStorage.setItem('authToken', authToken);

        if (response.data.redirect_to === 'mayors_page') {
          router.replace('/mayors_page'); 
        } else {
          router.replace('/home'); 
        }
      } else {
        setError('Login failed. No token received.');
      }
    } catch (error) {
      if (error.response) {
        setError('Incorrect username or password.');
      } else {
        setError('Failed to connect. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (!fontsLoaded) {
    return <AppLoading/>;  
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#1b2560" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            <StatusBar backgroundColor="#1b2560" barStyle="light-content" />

            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image
                  source={require("../assets/images/bagong-pilipinas.png")}
                  style={styles.logo}
                />
                <Image
                  source={require("../assets/images/sjc.png")}
                  style={styles.logo}
                />
                <Image
                  source={require("../assets/images/mayor.png")}
                  style={styles.logo}
                />
                <Image
                  source={require("../assets/images/icto.png")}
                  style={styles.logo}
                />
              </View>

              <Text style={styles.title}>Welcome!</Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.subTitle}>DOCUMENT TRACKING SYSTEM</Text>

              <View style={styles.inputContainer}>
                <Icon name="user" size={width * 0.05} color="#888" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="username"
                  placeholderTextColor="#888"
                  autoCapitalize="none"
                  value={username}
                  onChangeText={setUserName}
                />
              </View>

              <View style={styles.inputContainer}>
                <Icon name="lock" size={width * 0.05} color="#888" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="password"
                  placeholderTextColor="#888"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Icon name={showPassword ? 'eye' : 'eye-slash'} size={width * 0.05} color="#888" />
                </TouchableOpacity>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Conditionally render the footer logo */}
            {!isKeyboardVisible && (
              <View style={styles.floatingLogoContainer}>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.footerLogoContainer}>
                  <Image
                    source={require("../assets/images/npc-2.png")}
                    style={styles.footerLogo}
                  />
                </TouchableOpacity>
              </View>
            )}

            <Modal
              animationType="fade"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => {
                setModalVisible(!modalVisible);
              }}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setModalVisible(false)}
              >
                <View style={styles.modalContent}>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>X</Text>
                  </TouchableOpacity>
                  <Image source={require('../assets/images/npc.jpg')} style={styles.npcModalImage} />
                </View>
              </TouchableOpacity>
            </Modal>

            <Modal
              transparent={true}
              visible={showNoInternetModal}
              animationType="fade"
              onRequestClose={() => setShowNoInternetModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.noInternetModal}>
                  <MaterialCommunityIcons
                    name="wifi-off"
                    size={width * 0.12}
                    color="#ff0000"
                    style={styles.noWifiIcon}
                  />
                  <Text style={styles.noInternetText}>No Internet Connection</Text>
                  <TouchableOpacity
                    style={styles.okButton}
                    onPress={() => setShowNoInternetModal(false)}
                  >
                    <Text style={styles.okButtonText}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1b2560",
  },
  header: {
    flex: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1b2560",
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  logoContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: height * 0.02,
  },
  logo: {
    width: width * 0.2,
    height: width * 0.2,
    marginHorizontal: width * 0.01,
    resizeMode: "contain",
  },
  title: {
    color: "#fff",
    fontSize: width * 0.07,
    marginTop: height * 0.02,
    fontFamily: "DelaGothicOne-Regular",
  },
  formContainer: {
    flex: 3,
    backgroundColor: "#ffff",
    borderTopLeftRadius: width * 0.13,
    borderTopRightRadius: width * 0.13,
    paddingHorizontal: width * 0.05,
    justifyContent: "flex-start",
    paddingTop: height * 0.07,
    paddingBottom: height * 0.05,
  },
  subTitle: {
    textAlign: "center",
    color: "#1b2560",
    fontSize: width * 0.055,
    fontFamily: "Lato-Bold",
    marginBottom: height * 0.03,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: height * 0.07,
    backgroundColor: "#F8F9FC",
    borderRadius: width * 0.02,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: width * 0.04,
    marginBottom: height * 0.02,
  },
  icon: {
    marginRight: width * 0.02,
  },
  input: {
    flex: 1,
    fontSize: width * 0.045,
    color: "#333",
    fontFamily: "OpenSans-Regular",
    paddingLeft: width * 0.02,
  },
  errorText: {
    color: 'red',
    marginBottom: height * 0.01,
    fontSize: width * 0.04,
    textAlign: 'center',
    fontFamily: 'OpenSans-Regular',
  },
  loginButton: {
    height: height * 0.07,
    backgroundColor: "#a52a2a",
    borderRadius: width * 0.07,
    justifyContent: "center",
    alignItems: "center",
    marginTop: height * 0.015,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: width * 0.05,
    fontFamily: "OpenSans-Bold",
  },
  floatingLogoContainer: {
    position: "absolute",
    bottom: height * 0.07,
    alignSelf: "center",
    zIndex: 10,
  },
  footerLogoContainer: {
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: (width * 0.3) / 2,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#1b2560",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: height * 0.005 },
    shadowOpacity: 0.25,
    shadowRadius: width * 0.02,
    elevation: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  footerLogo: {
    width: "70%",
    height: "70%",
    resizeMode: "contain",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: width * 0.85,
    height: height * 0.4,
    backgroundColor: '#fff',
    borderRadius: width * 0.02,
    padding: width * 0.05,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: height * 0.015,
    right: width * 0.04,
    backgroundColor: '#ddd',
    borderRadius: width * 0.04,
    width: width * 0.08,
    height: width * 0.08,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: '#000',
  },
  npcModalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  noInternetModal: {
    width: width * 0.8,
    backgroundColor: '#fff',
    borderRadius: width * 0.02,
    justifyContent: 'center',
    alignItems: 'center',
    padding: width * 0.05,
  },
  noWifiIcon: {
    marginBottom: height * 0.02,
  },
  noInternetText: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: height * 0.02,
    textAlign: 'center',
  },
  okButton: {
    backgroundColor: '#4B0082',
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.015,
    borderRadius: width * 0.02,
  },
  okButtonText: {
    color: '#fff',
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
});
