import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View, TextInput, TouchableOpacity, ImageBackground, Image, Modal, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Dimensions } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [username, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [showNoInternetModal, setShowNoInternetModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

     
      const response = await axios.post('http://192.168.0.50:8000/api/login', {
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


  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <ImageBackground source={require('../assets/images/bg.png')} style={styles.background}>
            <View style={styles.logoContainer}>
              <Image source={require('../assets/images/bagong-pilipinas.png')} style={styles.logo} />
              <Image source={require('../assets/images/sjc.png')} style={styles.logo} />
              <Image source={require('../assets/images/mayor.png')} style={styles.logo} />
              <Image source={require('../assets/images/icto.png')} style={styles.logo} />
            </View>

            <Text style={styles.welcomeText}>Welcome!</Text>

            <LinearGradient
              colors={['#001f3f', '#001f3f']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.loginBox}
            >
              <Text style={styles.title}>DOCUMENT TRACKING SYSTEM</Text>

              <View style={styles.inputContainer}>
                <Icon name="user" size={20} color="#fff" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="username"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  autoCapitalize="none"
                  value={username}
                  onChangeText={setUserName}
                />
              </View>

              <View style={styles.inputContainer}>
                <Icon name="lock" size={20} color="#fff" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="password"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Icon name={showPassword ? 'eye' : 'eye-slash'} size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </LinearGradient>

            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.imageButton}>
              <Image source={require('../assets/images/seal2.png')} style={styles.npcImage} />
            </TouchableOpacity>

            <Modal
              animationType="none"
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
                <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={() => { }}>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>X</Text>
                  </TouchableOpacity>
                  <Image source={require('../assets/images/npc.jpg')} style={styles.npcModalImage} />
                </TouchableOpacity>
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
                    size={50}
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
          </ImageBackground>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 0,
    marginTop: 80,
  },
  logo: {
    width: 75,
    height: 80,
    margin: 3,
  },
  welcomeText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 10,
  },
  loginBox: {
    width: width * 0.9,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginTop: 30,
  },
  title: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 40,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 15,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  loginButton: {
    width: width * 0.75,
    height: 50,
    backgroundColor: '#800000',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    fontSize: 13,
  },
  imageButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  npcImage: {
    width: 120,
    height: 110,
    resizeMode: 'contain',
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: width * 0.9,
    height: height * 0.35,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  closeButtonText: {
    fontSize: 18,
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
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  noInternetText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
  },
  noWifiIcon: {
    marginBottom: 20, 
  },
  okButton: {
    backgroundColor: '#4B0082',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  okButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
