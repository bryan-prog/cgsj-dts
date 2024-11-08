import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, OpenSans_400Regular } from '@expo-google-fonts/open-sans';

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
  const [fontsLoaded] = useFonts({
    OpenSans_400Regular,
  });

  const [formData, setFormData] = useState<UserProfile | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  useEffect(() => {
    if (fontsLoaded) {
      fetchUserProfile();
    }
  }, [fontsLoaded]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);

      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('No authorization token found');
      }

      const response = await axios.get('http://dts.sanjuancity.gov.ph/api/my_profile', {
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
      setLoading(true);

      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('No authorization token found');
      }

      if (!formData) {
        throw new Error('Form data is missing');
      }

      // Prepare the data to be sent to the API
      const updateData = {
        user_id: formData.id.toString(),
        name: formData.name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        suffix: formData.suffix,
        contact: formData.contact,
      };

      const response = await axios.post(
        'http://dts.sanjuancity.gov.ph/api/edit_save',
        updateData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      // Log the API response
      console.log('API response after saving profile:', response.data);

      // Check if the response indicates success
      if (response.data.message === 'Successfully updated user details!') {
        // Fetch the updated user profile
        await fetchUserProfile();

        setShowSuccessModal(true);
      } else if (response.data.error) {
        // Handle errors returned by the API
        setFormErrors(response.data.error);
      } else {
        Alert.alert('Error', 'An unexpected error occurred.');
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      if (error.response && error.response.data && error.response.data.error) {
        setFormErrors(error.response.data.error);
      } else {
        Alert.alert('Error', 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2A47CB" />
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
      <Text style={styles.title}>My Profile</Text>
      <View style={styles.profileItem}>
        <Text style={styles.label}>First Name:</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => handleInputChange('name', text)}
        />
        {formErrors.name && <Text style={styles.errorText}>{formErrors.name[0]}</Text>}
      </View>
      <View style={styles.profileItem}>
        <Text style={styles.label}>Middle Name:</Text>
        <TextInput
          style={styles.input}
          value={formData.middle_name || ''}
          onChangeText={(text) => handleInputChange('middle_name', text)}
        />
        {formErrors.middle_name && (
          <Text style={styles.errorText}>{formErrors.middle_name[0]}</Text>
        )}
      </View>
      <View style={styles.profileItem}>
        <Text style={styles.label}>Last Name:</Text>
        <TextInput
          style={styles.input}
          value={formData.last_name}
          onChangeText={(text) => handleInputChange('last_name', text)}
        />
        {formErrors.last_name && (
          <Text style={styles.errorText}>{formErrors.last_name[0]}</Text>
        )}
      </View>
      <View style={styles.profileItem}>
        <Text style={styles.label}>Suffix:</Text>
        <TextInput
          style={styles.input}
          value={formData.suffix || ''}
          onChangeText={(text) => handleInputChange('suffix', text)}
        />
        {formErrors.suffix && (
          <Text style={styles.errorText}>{formErrors.suffix[0]}</Text>
        )}
      </View>
      <View style={styles.profileItem}>
        <Text style={styles.label}>Contact:</Text>
        <TextInput
          style={styles.input}
          value={formData.contact}
          onChangeText={(text) => handleInputChange('contact', text)}
        />
        {formErrors.contact && (
          <Text style={styles.errorText}>{formErrors.contact[0]}</Text>
        )}
      </View>
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>

      {/* Success Modal */}
      {showSuccessModal && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showSuccessModal}
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.successTitle}>Success</Text>
              <Text style={styles.successMessage}>
                Your profile has been successfully updated.
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSuccessModal(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'flex-start',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    fontFamily: 'OpenSans_400Regular',
    textAlign: 'center',
    alignSelf: 'center',
  },
  profileItem: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'OpenSans_400Regular',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    height: 45,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#DADCE0',
    borderRadius: 8,
    backgroundColor: '#F7F8FA',
    fontSize: 16,
    fontFamily: 'OpenSans_400Regular',
  },
  saveButton: {
    backgroundColor: '#2A47CB',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 15,
    width: '100%',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'OpenSans_400Regular',
  },
  errorText: {
    color: 'red',
    marginTop: 5,
    fontFamily: 'OpenSans_400Regular',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'OpenSans_400Regular',
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
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 10,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'OpenSans_400Regular',
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'OpenSans_400Regular',
  },
  closeButton: {
    backgroundColor: '#2A47CB',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 15,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'OpenSans_400Regular',
  },
});
