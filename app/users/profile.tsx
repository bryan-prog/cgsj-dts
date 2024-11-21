import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface UserProfile {
  id: number;
  name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  contact: string;
}

interface FormErrors {
  [key: string]: string[];
}

export default function Profile() {
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<UserProfile | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // State variables for password change
  const [newPassword, setNewPassword] = useState<string>('');
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [showPasswordInput, setShowPasswordInput] = useState<boolean>(false);

  const modalScaleAnim = useRef(new Animated.Value(0)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (showSuccessModal) {
      Animated.parallel([
        Animated.timing(modalScaleAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacityAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      modalScaleAnim.setValue(0);
      modalOpacityAnim.setValue(0);
    }
  }, [showSuccessModal]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);

      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('No authorization token found');
      }

      const response = await axios.get('http://192.168.0.50:8000/api/my_profile', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const userData = response.data.user;

      const userProfile: UserProfile = {
        id: userData.id,
        name: userData.name,
        middle_name: userData.middle_name,
        last_name: userData.last_name,
        suffix: userData.suffix,
        contact: userData.contact,
      };

      setUserData(userProfile);
      setFormData(userProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert(
        'Error',
        'An error occurred while fetching your profile. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (name: keyof UserProfile, value: string) => {
    if (formData) {
      setFormData({ ...formData, [name]: value });
      setFormErrors({ ...formErrors, [name]: undefined });
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);

      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('No authorization token found');
      }

      if (!formData) {
        throw new Error('Form data is missing');
      }

      const updateData = {
        user_id: formData.id.toString(),
        name: formData.name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        suffix: formData.suffix,
        contact: formData.contact,
      };

      const response = await axios.post(
        'http://192.168.0.50:8000/api/edit_save',
        updateData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      console.log('API response after saving profile:', response.data);

      if (response.data.message === 'Successfully updated user details!') {
        setIsSaving(false);
        await fetchUserProfile();
        setSuccessMessage(response.data.message);
        setShowSuccessModal(true);
        setIsEditing(false);
      } else if (response.data.error) {
        setFormErrors(response.data.error);
        setIsSaving(false);
      } else {
        Alert.alert('Error', 'An unexpected error occurred.');
        setIsSaving(false);
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      if (error.response && error.response.data && error.response.data.error) {
        setFormErrors(error.response.data.error);
      } else {
        Alert.alert('Error', 'An unexpected error occurred.');
      }
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setIsChangingPassword(true);
      setPasswordChangeError(null);

      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('No authorization token found');
      }

      const changePassData = {
        change_pass: newPassword,
      };

      const response = await axios.post(
        'http://192.168.0.50:8000/api/change_pass',
        changePassData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      console.log('API response after changing password:', response.data);

      if (response.data.message === 'Successfully updated password!') {
        setIsChangingPassword(false);
        setNewPassword(''); // Clear the password field
        setSuccessMessage(response.data.message);
        setShowSuccessModal(true);
        setShowPasswordInput(false);
      } else if (response.data.error) {
        setPasswordChangeError(response.data.error);
        setIsChangingPassword(false);
      } else {
        Alert.alert('Error', 'An unexpected error occurred.');
        setIsChangingPassword(false);
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.response && error.response.data && error.response.data.error) {
        setPasswordChangeError(error.response.data.error);
      } else {
        Alert.alert('Error', 'An unexpected error occurred.');
      }
      setIsChangingPassword(false);
    }
  };

  const hasChanges =
    userData &&
    formData &&
    (userData.name !== formData.name ||
      userData.middle_name !== formData.middle_name ||
      userData.last_name !== formData.last_name ||
      userData.suffix !== formData.suffix ||
      userData.contact !== formData.contact);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A52A2A" />
      </View>
    );
  }

  if (!userData || !formData) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No user data available.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileHeader}>
        <Ionicons
          name="person-circle-outline"
          size={90}
          color="#fff"
          style={styles.profileIcon}
        />
        <Text style={styles.profileName}>My Profile</Text>
      </View>

      <View style={styles.formContainer}>
        {/* Buttons before the input fields */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: isEditing
                  ? hasChanges
                    ? '#28a745' // Green color when there are unsaved changes
                    : '#041435' // Same as Edit Profile button color
                  : '#041435', // Same as Edit Profile button color when not editing
              },
              isEditing && !hasChanges ? styles.disabledButton : null,
              { opacity: isEditing && !hasChanges ? 0.6 : 1 },
            ]}
            onPress={() => {
              if (isEditing) {
                handleSaveProfile();
              } else {
                setIsEditing(true);
              }
            }}
            disabled={isEditing && !hasChanges}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              { opacity: isChangingPassword ? 0.6 : 1 },
            ]}
            onPress={() => {
              setShowPasswordInput(true);
            }}
            disabled={isChangingPassword}
          >
            <Text style={styles.buttonText}>Change Password</Text>
          </TouchableOpacity>
        </View>

        {formErrors.general && <Text style={styles.errorText}>{formErrors.general}</Text>}

        {/* Input fields */}
        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: isEditing ? '#FFFFFF' : '#F0F0F0' },
          ]}
          placeholder="Your first name"
          placeholderTextColor="#9E9E9E"
          value={formData.name}
          onChangeText={(value) => handleInputChange('name', value)}
          autoCapitalize="words"
          editable={isEditing}
        />
        {formErrors.name && <Text style={styles.errorText}>{formErrors.name[0]}</Text>}

        <Text style={styles.label}>Middle Name</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: isEditing ? '#FFFFFF' : '#F0F0F0' },
          ]}
          placeholder="Your middle name"
          placeholderTextColor="#9E9E9E"
          value={formData.middle_name || ''}
          onChangeText={(value) => handleInputChange('middle_name', value)}
          autoCapitalize="words"
          editable={isEditing}
        />
        {formErrors.middle_name && (
          <Text style={styles.errorText}>{formErrors.middle_name[0]}</Text>
        )}

        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: isEditing ? '#FFFFFF' : '#F0F0F0' },
          ]}
          placeholder="Your last name"
          placeholderTextColor="#9E9E9E"
          value={formData.last_name}
          onChangeText={(value) => handleInputChange('last_name', value)}
          autoCapitalize="words"
          editable={isEditing}
        />
        {formErrors.last_name && (
          <Text style={styles.errorText}>{formErrors.last_name[0]}</Text>
        )}

        <Text style={styles.label}>Suffix</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: isEditing ? '#FFFFFF' : '#F0F0F0' },
          ]}
          placeholder="Your suffix"
          placeholderTextColor="#9E9E9E"
          value={formData.suffix || ''}
          onChangeText={(value) => handleInputChange('suffix', value)}
          editable={isEditing}
        />
        {formErrors.suffix && (
          <Text style={styles.errorText}>{formErrors.suffix[0]}</Text>
        )}

        <Text style={styles.label}>Contact No.</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: isEditing ? '#FFFFFF' : '#F0F0F0' },
          ]}
          placeholder="Your contact number"
          placeholderTextColor="#9E9E9E"
          keyboardType="phone-pad"
          value={formData.contact}
          onChangeText={(value) => handleInputChange('contact', value)}
          editable={isEditing}
        />
        {formErrors.contact && (
          <Text style={styles.errorText}>{formErrors.contact[0]}</Text>
        )}

      
        {showPasswordInput && (
          <>
          
            <View style={styles.separator} />

            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              placeholderTextColor="#9E9E9E"
              value={newPassword}
              onChangeText={(value) => setNewPassword(value)}
              secureTextEntry={true}
            />
            {passwordChangeError && (
              <Text style={styles.errorText}>{passwordChangeError}</Text>
            )}

            {/* Single "Change" button with updated color */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.fullWidthButton,
                { backgroundColor: '#0066b2' }, // Updated button color
                { opacity: !newPassword || isChangingPassword ? 0.6 : 1 },
              ]}
              onPress={handleChangePassword}
              disabled={!newPassword || isChangingPassword}
            >
              {isChangingPassword ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Change</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

  
      <Modal
        transparent={true}
        visible={showSuccessModal}
        animationType="none"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: modalOpacityAnim,
                transform: [
                  {
                    scale: modalScaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={80}
              color="#28a745"
              style={styles.successIcon}
            />
            <Text style={styles.successTitle}>Success</Text>
            <Text style={styles.successMessage}>
              {successMessage || 'Your profile has been successfully updated.'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    backgroundColor: '#041435',
    paddingVertical: 40,
    alignItems: 'center',
    marginBottom: 30,
  },
  profileIcon: {
    marginBottom: 10,
  },
  profileName: {
    fontSize: 26,
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    fontWeight: 'bold',
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    color: '#3C4043',
    alignSelf: 'flex-start',
    marginBottom: 5,
    marginTop: 10,
    fontWeight: 'bold',
    fontFamily: 'Roboto-Regular',
  },
  input: {
    width: '100%',
    height: 50,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#DADCE0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#202124',
    marginBottom: 5,
    fontFamily: 'Roboto-Regular',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  separator: {
    borderBottomColor: '#DADCE0',
    borderBottomWidth: 1,
    marginVertical: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    height: 50,
    backgroundColor: '#A52A2A', 
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
   
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  fullWidthButton: {
    width: '100%',
    marginHorizontal: 0,
    marginTop: 20,
  },
  disabledButton: {

  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
  },
  errorText: {
    color: 'red',
    marginTop: 5,
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
    alignSelf: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 10,
  },
  successIcon: {
    marginBottom: 15,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#28a745',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Poppins-Bold',
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Roboto-Regular',
    color: '#3C4043',
  },
  closeButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#A52A2A',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
  },
});
