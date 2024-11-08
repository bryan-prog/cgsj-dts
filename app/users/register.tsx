import React, { useState, useEffect } from 'react';
import DropDownPicker from 'react-native-dropdown-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  View,
  Platform,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FormData {
  name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  office_dept: string; 
  designation: string;
  contact: string;
  username: string;
  user_level: string;
  password: string;
  password_confirmation: string;
}

interface Errors {
  name?: string;
  middle_name?: string;
  last_name?: string;
  suffix?: string;
  office_dept?: string;
  designation?: string;
  contact?: string;
  username?: string;
  user_level?: string;
  password?: string;
  password_confirmation?: string;
  general?: string;
  [key: string]: string | undefined;
}

interface Department {
  id: number;
  dept_description: string;
  dept_code: string;
  dept_floor: string;
  tag: string;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    office_dept: '----', 
    designation: '',
    contact: '',
    username: '',
    user_level: '----', 
    password: '',
    password_confirmation: '',
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Errors>({});
  const [departments, setDepartments] = useState<Department[]>([]);


  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [departmentValue, setDepartmentValue] = useState<string>('---');
  const [departmentItems, setDepartmentItems] = useState<
    { label: string; value: string }[]
  >([]);

  
  const [userLevelOpen, setUserLevelOpen] = useState(false);
  const [userLevelValue, setUserLevelValue] = useState<string>('----');
  const [userLevelItems, setUserLevelItems] = useState<
    { label: string; value: string }[]
  >([
    { label: '----', value: '----' },
    { label: 'Super Admin', value: 'Super Admin' },
    { label: 'Admin', value: 'Admin' },
    { label: 'User', value: 'User' },
  ]);

  
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState<boolean>(false);

  const handleInputChange = (
    name: keyof FormData,
    value: string | number
  ) => {
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: undefined, general: undefined });
  };

  const storeToken = async (token: string) => {
    try {
      await AsyncStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Error storing token', error);
    }
  };

  const getToken = async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        return token;
      } else {
        Alert.alert('Error', 'No authentication token found.');
      }
    } catch (error) {
      console.error('Error fetching token', error);
    }
    return null;
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await axios.get(
          'http://dts.sanjuancity.gov.ph/api/department',
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          }
        );

        const departmentsData = response.data.office;
        const departmentsArray = Object.values(departmentsData) as Department[];
        setDepartments(departmentsArray);

       
        const items = departmentsArray.map((dept) => ({
          label: dept.dept_description,
          value: dept.dept_code, 
          
        }));
       
        items.unshift({ label: '---', value: '---' });
        setDepartmentItems(items);
      } catch (error) {
        console.error('Error fetching departments:', error);
        Alert.alert(
          'Error',
          'An error occurred while fetching departments. Please try again later.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleRegister = async () => {
    const {
      name,
      middle_name,
      last_name,
      suffix,
      office_dept,
      designation,
      contact,
      username,
      user_level,
      password,
      password_confirmation,
    } = formData;

    setErrors({});

    const newErrors: Errors = {};
    if (!name) newErrors.name = 'First name is required.';
    if (!last_name) newErrors.last_name = 'Last name is required.';
    if (!designation) newErrors.designation = 'Designation is required.';
    if (!contact) newErrors.contact = 'Contact number is required.';
    if (!username) newErrors.username = 'Username is required.';
    if (!password) newErrors.password = 'Password is required.';
    if (!password_confirmation)
      newErrors.password_confirmation = 'Please confirm your password.';
    if (password !== password_confirmation)
      newErrors.password_confirmation = 'The password confirmation does not match.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.post(
        'http://dts.sanjuancity.gov.ph/api/register',
        {
          name,
          middle_name,
          last_name,
          suffix,
          office_dept,
          designation,
          contact,
          username,
          user_level,
          password,
          password_confirmation,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        const token = response.data.token;
        await storeToken(token);

        Alert.alert('Success', 'Registration completed successfully.');
        setFormData({
          name: '',
          middle_name: '',
          last_name: '',
          suffix: '',
          office_dept: '----', 
          designation: '',
          contact: '',
          username: '',
          user_level: '----', 
          password: '',
          password_confirmation: '',
        });
        setDepartmentValue('---'); 
        setUserLevelValue('----'); 
      } else {
        Alert.alert(
          'Registration Failed',
          response.data.message || 'An error occurred during registration.'
        );
      }
    } catch (error: any) {
      console.error(error);
      if (error.response && error.response.data) {
        console.log('Server Error Response:', error.response.data);

        if (error.response.data.error) {
          const serverErrors = error.response.data.error;
          const formattedErrors: Errors = {};
          for (const key in serverErrors) {
            if (serverErrors.hasOwnProperty(key)) {
              formattedErrors[key] = serverErrors[key][0];
            }
          }
          setErrors(formattedErrors);
        } else if (error.response.data.message) {
          setErrors({ general: error.response.data.message });
        } else {
          setErrors({ general: 'An error occurred during registration.' });
        }
      } else if (error.request) {
        setErrors({
          general: 'No response from server. Please try again later.',
        });
      } else {
        setErrors({ general: 'An error occurred. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Register New User</Text>
      {errors.general && <Text style={styles.errorText}>{errors.general}</Text>}

      <Text style={styles.label}>First Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Your first name"
        placeholderTextColor="#9E9E9E"
        value={formData.name}
        onChangeText={(value) => handleInputChange('name', value)}
        autoCapitalize="words"
      />
      {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

      <Text style={styles.label}>Middle Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Your middle name"
        placeholderTextColor="#9E9E9E"
        value={formData.middle_name}
        onChangeText={(value) => handleInputChange('middle_name', value)}
        autoCapitalize="words"
      />
      {errors.middle_name && (
        <Text style={styles.errorText}>{errors.middle_name}</Text>
      )}

      <Text style={styles.label}>Last Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Your last name"
        placeholderTextColor="#9E9E9E"
        value={formData.last_name}
        onChangeText={(value) => handleInputChange('last_name', value)}
        autoCapitalize="words"
      />
      {errors.last_name && (
        <Text style={styles.errorText}>{errors.last_name}</Text>
      )}

      <Text style={styles.label}>Suffix</Text>
      <TextInput
        style={styles.input}
        placeholder="Your suffix"
        placeholderTextColor="#9E9E9E"
        value={formData.suffix}
        onChangeText={(value) => handleInputChange('suffix', value)}
      />
      {errors.suffix && <Text style={styles.errorText}>{errors.suffix}</Text>}

      <Text style={styles.label}>Assigned Office/Department</Text>
      <View style={styles.dropdownContainer}>
        <DropDownPicker
          open={departmentOpen}
          value={departmentValue}
          items={departmentItems}
          setOpen={setDepartmentOpen}
          setValue={(callback) => {
            const value = callback(departmentValue);
            setDepartmentValue(value);
            handleInputChange('office_dept', value);
          }}
          setItems={setDepartmentItems}
          searchable={true}
          onChangeValue={(value) => {
            handleInputChange('office_dept', value);
          }}
          style={[
            styles.dropdown,
            errors.office_dept && { borderColor: 'red' },
          ]}
          placeholderStyle={{ color: '#9E9E9E' }}
          dropDownContainerStyle={styles.dropdownContainerStyle}
          listMode="MODAL"
          modalProps={{
            animationType: 'slide',
          }}
          zIndex={3000}
          zIndexInverse={1000}
        />
      </View>
      {errors.office_dept && (
        <Text style={styles.errorText}>{errors.office_dept}</Text>
      )}

      <Text style={styles.label}>Designation</Text>
      <TextInput
        style={styles.input}
        placeholder="Your designation"
        placeholderTextColor="#9E9E9E"
        value={formData.designation}
        onChangeText={(value) => handleInputChange('designation', value)}
        autoCapitalize="words"
      />
      {errors.designation && (
        <Text style={styles.errorText}>{errors.designation}</Text>
      )}

      <Text style={styles.label}>Contact No.</Text>
      <TextInput
        style={styles.input}
        placeholder="Your contact number"
        placeholderTextColor="#9E9E9E"
        keyboardType="phone-pad"
        value={formData.contact}
        onChangeText={(value) => handleInputChange('contact', value)}
      />
      {errors.contact && (
        <Text style={styles.errorText}>{errors.contact}</Text>
      )}

      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        placeholder="Your desired username"
        placeholderTextColor="#9E9E9E"
        value={formData.username}
        onChangeText={(value) => handleInputChange('username', value)}
        autoCapitalize="none"
      />
      {errors.username && (
        <Text style={styles.errorText}>{errors.username}</Text>
      )}

      <Text style={styles.label}>User Level</Text>
      <View style={styles.dropdownContainer}>
        <DropDownPicker
          open={userLevelOpen}
          value={userLevelValue}
          items={userLevelItems}
          setOpen={setUserLevelOpen}
          setValue={(callback) => {
            const value = callback(userLevelValue);
            setUserLevelValue(value);
            handleInputChange('user_level', value);
          }}
          setItems={setUserLevelItems}
          style={[
            styles.dropdown,
            errors.user_level && { borderColor: 'red' },
          ]}
          onChangeValue={(value) => {
            handleInputChange('user_level', value);
          }}
          dropDownContainerStyle={styles.dropdownContainerStyle}
          listMode="SCROLLVIEW"
          zIndex={2000}
          zIndexInverse={2000}
        />
      </View>
      {errors.user_level && (
        <Text style={styles.errorText}>{errors.user_level}</Text>
      )}

      <Text style={styles.label}>Password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          placeholderTextColor="#9E9E9E"
          secureTextEntry={!passwordVisible}
          value={formData.password}
          onChangeText={(value) => handleInputChange('password', value)}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setPasswordVisible(!passwordVisible)}
        >
          <Ionicons
            name={passwordVisible ? 'eye' : 'eye-off'}
            size={24}
            color="#9E9E9E"
          />
        </TouchableOpacity>
      </View>
      {errors.password && (
        <Text style={styles.errorText}>{errors.password}</Text>
      )}

      <Text style={styles.label}>Confirm Password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Re-enter password"
          placeholderTextColor="#9E9E9E"
          secureTextEntry={!confirmPasswordVisible}
          value={formData.password_confirmation}
          onChangeText={(value) =>
            handleInputChange('password_confirmation', value)
          }
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() =>
            setConfirmPasswordVisible(!confirmPasswordVisible)
          }
        >
          <Ionicons
            name={confirmPasswordVisible ? 'eye' : 'eye-off'}
            size={24}
            color="#9E9E9E"
          />
        </TouchableOpacity>
      </View>
      {errors.password_confirmation && (
        <Text style={styles.errorText}>{errors.password_confirmation}</Text>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    flexGrow: 1,
  },
  title: {
    fontSize: 32,
    color: '#000000',
    marginBottom: 20,
    fontFamily: 'Poppins-Bold',
  },
  label: {
    fontSize: 16,
    color: '#3C4043',
    alignSelf: 'flex-start',
    marginBottom: 5,
    marginTop: 10,
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
  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DADCE0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#202124',
    fontFamily: 'Roboto-Regular',
  },
  eyeIcon: {
    paddingHorizontal: 16,
  },
  dropdownContainer: {
    width: '100%',
    marginBottom: 5,
    zIndex: 3000,
  },
  dropdown: {
    borderColor: '#DADCE0',
    minHeight: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dropdownContainerStyle: {
    borderColor: '#DADCE0',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#A52A2A',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
  },
  errorText: {
    color: 'red',
    alignSelf: 'flex-start',
    marginBottom: 5,
    fontSize: 14,
  },
});

export default Register;
