import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DropDownPicker from 'react-native-dropdown-picker';
import { AntDesign, Ionicons } from '@expo/vector-icons';

import { useFonts } from 'expo-font';
import AppLoading from 'expo-app-loading';
import Tooltip from './tooltip'; 

interface User {
  id: number;
  name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  office_dept: string;
  designation: string;
  contact: string;
  username: string;
  user_level: string;
  active: string;
}

interface FormData {
  user_id: string;
  name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  office_dept: string;
  designation: string;
  contact: string;
  username: string;
  user_level: string;
  active: string;
}

interface FormErrors {
  [key: string]: string[];
  password?: string[];
}

interface Department {
  label: string;
  value: string;
}

export default function ListOfUsers() {
  const [fontsLoaded] = useFonts({
    'OpenSans-Regular': require('../../assets/fonts/OpenSans-Regular.ttf'),
    'OpenSans-Bold': require('../../assets/fonts/OpenSans-Bold.ttf'),
    'Lato-Bold': require('../../assets/fonts/Lato-Bold.ttf'),
  });

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const usersPerPage = 10;

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    user_id: '',
    name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    office_dept: '',
    designation: '',
    contact: '',
    username: '',
    user_level: '',
    active: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [departmentValue, setDepartmentValue] = useState<string>('');
  const [departmentItems, setDepartmentItems] = useState<Department[]>([]);

  const [userLevelOpen, setUserLevelOpen] = useState(false);
  const [userLevelValue, setUserLevelValue] = useState<string>('');
  const [userLevelItems, setUserLevelItems] = useState<
    { label: string; value: string }[]
  >([
    { label: 'Super Admin', value: 'Super Admin' },
    { label: 'Admin', value: 'Admin' },
    { label: 'User', value: 'User' },
  ]);

  const [activeStatusOpen, setActiveStatusOpen] = useState(false);
  const [activeStatusValue, setActiveStatusValue] = useState<string>('');

  const [password, setPassword] = useState<string>('');
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  const modalScaleAnim = useRef(new Animated.Value(0)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (fontsLoaded) {
      fetchDepartments();
      fetchUsers();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <AppLoading />;
  }

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

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('No authorization token found');
      }

      const response = await axios.get(
        `http://dts.sanjuancity.gov.ph/api/list-user`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const usersData = response.data.users;
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const authToken = await AsyncStorage.getItem('authToken');

      if (!authToken) {
        throw new Error('No authorization token found');
      }

      const response = await axios.get(
        'http://dts.sanjuancity.gov.ph/api/department',
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      const departmentsData = response.data.office;
      const departmentsArray = Object.values(departmentsData).map(
        (dept: any) => ({
          label: dept.dept_description,
          value: dept.dept_code,
        })
      );
      setDepartments(departmentsArray);
      setDepartmentItems(departmentsArray);
    } catch (error) {
      console.error('Error fetching departments:', error);
      Alert.alert(
        'Error',
        'An error occurred while fetching departments. Please try again later.'
      );
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleInputChange = (
    name: keyof FormData,
    value: string | number
  ) => {
    setFormData({ ...formData, [name]: value });
    setFormErrors({ ...formErrors, [name]: undefined });
  };

  function validateFormData(formData: FormData): FormErrors {
    const errors: FormErrors = {};
    if (!formData.name) errors.name = ['First name is required.'];
    if (!formData.last_name) errors.last_name = ['Last name is required.'];
    if (!formData.designation)
      errors.designation = ['Designation is required.'];
    if (!formData.contact) errors.contact = ['Contact number is required.'];
    if (!formData.username) errors.username = ['Username is required.'];
    if (!formData.office_dept)
      errors.office_dept = ['Assigned office is required.'];
    if (!formData.user_level)
      errors.user_level = ['User level is required.'];

    return errors;
  }

  const filteredUsers = users.filter((user) => {
    const searchTerm = search.toLowerCase();

    const idMatch = user.id.toString().includes(searchTerm);
    const nameMatch = `${user.name} ${user.middle_name} ${user.last_name}`
      .toLowerCase()
      .includes(searchTerm);
    const officeMatch = user.office_dept.toLowerCase().includes(searchTerm);
    const designationMatch = (user.designation || '')
      .toLowerCase()
      .includes(searchTerm);
    const usernameMatch = user.username.toLowerCase().includes(searchTerm);
    const status = user.active === '1' ? 'active' : 'inactive';
    const statusMatch = status.includes(searchTerm);

    return (
      idMatch ||
      nameMatch ||
      officeMatch ||
      designationMatch ||
      usernameMatch ||
      statusMatch
    );
  });

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[
        styles.userRow,
        selectedUserId === item.id && styles.selectedUserRow,
      ]}
      onPress={() => setSelectedUserId(item.id)}
    >
      <Text style={styles.cell}>{item.id}</Text>
      <Text style={styles.cell}>
        {item.name} {item.middle_name} {item.last_name}
      </Text>
      <Text style={styles.cell}>{item.office_dept}</Text>
      <Text style={styles.cell}>{item.designation || 'N/A'}</Text>
      <Text style={styles.cell}>{item.username}</Text>
      <Text style={styles.cell}>
        {item.active === '1' ? 'Active' : 'Inactive'}
      </Text>
    </TouchableOpacity>
  );

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  const handleEditUser = () => {
    if (selectedUserId !== null) {
      const user = users.find((u) => u.id === selectedUserId);
      if (user) {
        setFormData({
          user_id: user.id.toString(),
          name: user.name || '',
          middle_name: user.middle_name || '',
          last_name: user.last_name || '',
          suffix: user.suffix || '',
          office_dept: user.office_dept || '',
          designation: user.designation || '',
          contact: user.contact || '',
          username: user.username || '',
          user_level: user.user_level || '',
          active: user.active.toString(),
        });
        setDepartmentValue(user.office_dept || '');
        setUserLevelValue(user.user_level || '');
        setActiveStatusValue(user.active.toString());
        setFormErrors({});
        setPassword('');
        setShowEditModal(true);
      }
    } else {
      Alert.alert('Selection Required', 'Please select a user to edit.');
    }
  };

  const handleSaveUser = async () => {
    const errors = validateFormData(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setLoading(true);
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('No authorization token found');
      }

      const response = await axios.post(
        'http://dts.sanjuancity.gov.ph/api/edit-user',
        formData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      const updatedUser = response.data.user;

      const updatedUsers = users.map((user) =>
        user.id === updatedUser.id ? updatedUser : user
      );
      setUsers(updatedUsers);

      setShowEditModal(false);
      setSelectedUserId(null);
      setSuccessMessage('User information has been successfully updated.');
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Error saving user:', error);
      if (error.response && error.response.data && error.response.data.error) {
        setFormErrors(error.response.data.error);
      } else {
        Alert.alert('Error', 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUserId) {
      Alert.alert('Error', 'No user selected.');
      return;
    }
    if (!password) {
      setFormErrors({ password: ['Password is required.'] });
      return;
    }
    try {
      setIsChangingPassword(true);
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('No authorization token found');
      }

      const data = {
        user_id: selectedUserId,
        password: password,
        password_confirmation: password, 
      };

      const response = await axios.post(
        'http://dts.sanjuancity.gov.ph/api/change-password',
        data,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

    
      if (response.data.message) {
        setSuccessMessage(response.data.message);
      } else {
        setSuccessMessage('Password has been successfully changed.');
      }
      setShowSuccessModal(true);
      setPassword('');
      setFormErrors({});
    } catch (error: any) {
      console.error(
        'Error changing password:',
        error.response ? error.response.data : error
      );
      if (error.response && error.response.data && error.response.data.error) {
        setFormErrors(error.response.data.error);
      } else {
        Alert.alert('Error', 'An unexpected error occurred.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const generatePageNumbers = () => {
    const pageNumbers = [];
    const totalNumbers = 5;
    const halfTotalNumbers = Math.floor(totalNumbers / 2);

    let startPage = Math.max(2, currentPage - halfTotalNumbers);
    let endPage = Math.min(totalPages - 1, currentPage + halfTotalNumbers);

    if (currentPage <= halfTotalNumbers) {
      endPage = totalNumbers;
    }

    if (currentPage + halfTotalNumbers >= totalPages) {
      startPage = totalPages - totalNumbers + 1;
    }

    startPage = Math.max(startPage, 2);
    endPage = Math.min(endPage, totalPages - 1);

    pageNumbers.push(1);

    if (startPage > 2) {
      pageNumbers.push('left-ellipsis');
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (endPage < totalPages - 1) {
      pageNumbers.push('right-ellipsis');
    }

    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  const pageNumbers = generatePageNumbers();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LIST OF USERS</Text>
      <TouchableOpacity
        style={[
          styles.editUserButton,
          { backgroundColor: selectedUserId ? '#8B0000' : '#ccc' },
        ]}
        onPress={handleEditUser}
        disabled={!selectedUserId}
      >
        <Text style={styles.editUserButtonText}>Edit User</Text>
      </TouchableOpacity>
      <TextInput
        style={[
          styles.searchInput,
          isSearchFocused && styles.searchInputFocused,
        ]}
        placeholder="Search..."
        value={search}
        onChangeText={setSearch}
        onFocus={() => setIsSearchFocused(true)}
        onBlur={() => setIsSearchFocused(false)}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#2A47CB" />
      ) : (
        <ScrollView horizontal>
          <View>
            <View style={styles.header}>
              <Text style={styles.headerCell}>ID</Text>
              <Text style={styles.headerCell}>Name</Text>
              <Text style={styles.headerCell}>Office</Text>
              <Text style={styles.headerCell}>Designation</Text>
              <Text style={styles.headerCell}>Username</Text>
              <Text style={styles.headerCell}>Status</Text>
            </View>
            {currentUsers.length === 0 ? (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>No data found.</Text>
              </View>
            ) : (
              <FlatList
                data={currentUsers}
                renderItem={renderUser}
                keyExtractor={(item) => item.id.toString()}
                extraData={selectedUserId}
              />
            )}
          </View>
        </ScrollView>
      )}

      <View style={styles.paginationContainer}>
        <TouchableOpacity
          onPress={handlePreviousPage}
          disabled={currentPage === 1 || totalPages === 0}
          style={[
            styles.paginationButton,
            (currentPage === 1 || totalPages === 0) && styles.disabledButton,
          ]}
        >
          <AntDesign
            name="left"
            size={20}
            color={currentPage === 1 || totalPages === 0 ? '#ccc' : '#2A47CB'}
          />
        </TouchableOpacity>

        <View style={styles.pageNumbersContainer}>
          {pageNumbers.map((number, index) => {
            if (number === 'left-ellipsis' || number === 'right-ellipsis') {
              return (
                <Text key={index} style={styles.ellipsisText}>
                  ...
                </Text>
              );
            } else {
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handlePageChange(number as number)}
                  style={[
                    styles.pageNumberButton,
                    currentPage === number && styles.currentPageButton,
                  ]}
                  disabled={totalPages === 0}
                >
                  <Text
                    style={[
                      styles.pageNumberText,
                      currentPage === number && styles.currentPageText,
                    ]}
                  >
                    {number}
                  </Text>
                </TouchableOpacity>
              );
            }
          })}
        </View>

        <TouchableOpacity
          onPress={handleNextPage}
          disabled={currentPage === totalPages || totalPages === 0}
          style={[
            styles.paginationButton,
            (currentPage === totalPages || totalPages === 0) &&
              styles.disabledButton,
          ]}
        >
          <AntDesign
            name="right"
            size={20}
            color={
              currentPage === totalPages || totalPages === 0
                ? '#ccc'
                : '#2A47CB'
            }
          />
        </TouchableOpacity>
      </View>

  
      {showEditModal && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={showEditModal}
          onRequestClose={() => {
            setShowEditModal(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainerEdit}>
              <ScrollView>
                <Text style={styles.modalTitle}>Edit User Details</Text>

                
                <Text style={styles.label}>First Name</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, formErrors.name && styles.inputError]}
                    placeholder="First Name"
                    placeholderTextColor="#7C7C7C"
                    value={formData.name}
                    onChangeText={(text) => handleInputChange('name', text)}
                  />
                  {formErrors.name && (
                    <Tooltip message={formErrors.name[0]}>
                      <TouchableOpacity style={styles.errorIconContainer}>
                        <AntDesign
                          name="exclamationcircleo"
                          size={20}
                          color="red"
                        />
                      </TouchableOpacity>
                    </Tooltip>
                  )}
                </View>

             
                <Text style={styles.label}>Middle Name</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Middle Name"
                    placeholderTextColor="#7C7C7C"
                    value={formData.middle_name}
                    onChangeText={(text) =>
                      handleInputChange('middle_name', text)
                    }
                  />
                </View>

              
                <Text style={styles.label}>Last Name</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      formErrors.last_name && styles.inputError,
                    ]}
                    placeholder="Last Name"
                    placeholderTextColor="#7C7C7C"
                    value={formData.last_name}
                    onChangeText={(text) =>
                      handleInputChange('last_name', text)
                    }
                  />
                  {formErrors.last_name && (
                    <Tooltip message={formErrors.last_name[0]}>
                      <TouchableOpacity style={styles.errorIconContainer}>
                        <AntDesign
                          name="exclamationcircleo"
                          size={20}
                          color="red"
                        />
                      </TouchableOpacity>
                    </Tooltip>
                  )}
                </View>

               
                <Text style={styles.label}>Suffix</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Suffix"
                    placeholderTextColor="#7C7C7C"
                    value={formData.suffix}
                    onChangeText={(text) => handleInputChange('suffix', text)}
                  />
                </View>

               
                <Text style={styles.label}>Assigned Office/Department</Text>
                <View style={styles.inputContainer}>
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
                    searchable
                    listMode="MODAL"
                    placeholder="Select Department"
                    style={[
                      styles.dropdown,
                      formErrors.office_dept && styles.inputError,
                    ]}
                    dropDownContainerStyle={styles.dropdownContainer}
                    placeholderStyle={styles.placeholderStyle}
                    textStyle={styles.textStyle}
                  />
                  {formErrors.office_dept && (
                    <Tooltip message={formErrors.office_dept[0]}>
                      <TouchableOpacity style={styles.errorIconContainer}>
                        <AntDesign
                          name="exclamationcircleo"
                          size={20}
                          color="red"
                        />
                      </TouchableOpacity>
                    </Tooltip>
                  )}
                </View>

               
                <Text style={styles.label}>Designation</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      formErrors.designation && styles.inputError,
                    ]}
                    placeholder="Designation"
                    placeholderTextColor="#7C7C7C"
                    value={formData.designation}
                    onChangeText={(text) =>
                      handleInputChange('designation', text)
                    }
                  />
                  {formErrors.designation && (
                    <Tooltip message={formErrors.designation[0]}>
                      <TouchableOpacity style={styles.errorIconContainer}>
                        <AntDesign
                          name="exclamationcircleo"
                          size={20}
                          color="red"
                        />
                      </TouchableOpacity>
                    </Tooltip>
                  )}
                </View>

              
                <Text style={styles.label}>Contact</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      formErrors.contact && styles.inputError,
                    ]}
                    placeholder="Contact Number"
                    placeholderTextColor="#7C7C7C"
                    value={formData.contact}
                    onChangeText={(text) => handleInputChange('contact', text)}
                  />
                  {formErrors.contact && (
                    <Tooltip message={formErrors.contact[0]}>
                      <TouchableOpacity style={styles.errorIconContainer}>
                        <AntDesign
                          name="exclamationcircleo"
                          size={20}
                          color="red"
                        />
                      </TouchableOpacity>
                    </Tooltip>
                  )}
                </View>

             
                <Text style={styles.label}>Username</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      formErrors.username && styles.inputError,
                    ]}
                    placeholder="Username"
                    placeholderTextColor="#7C7C7C"
                    value={formData.username}
                    onChangeText={(text) =>
                      handleInputChange('username', text)
                    }
                  />
                  {formErrors.username && (
                    <Tooltip message={formErrors.username[0]}>
                      <TouchableOpacity style={styles.errorIconContainer}>
                        <AntDesign
                          name="exclamationcircleo"
                          size={20}
                          color="red"
                        />
                      </TouchableOpacity>
                    </Tooltip>
                  )}
                </View>

            
                <Text style={styles.label}>User Level</Text>
                <View style={styles.inputContainer}>
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
                    listMode="SCROLLVIEW"
                    placeholder="Select User Level"
                    style={[
                      styles.dropdown,
                      formErrors.user_level && styles.inputError,
                    ]}
                    dropDownContainerStyle={styles.dropdownContainer}
                    placeholderStyle={styles.placeholderStyle}
                    textStyle={styles.textStyle}
                  />
                  {formErrors.user_level && (
                    <Tooltip message={formErrors.user_level[0]}>
                      <TouchableOpacity style={styles.errorIconContainer}>
                        <AntDesign
                          name="exclamationcircleo"
                          size={20}
                          color="red"
                        />
                      </TouchableOpacity>
                    </Tooltip>
                  )}
                </View>

              
                <Text style={styles.label}>User Status</Text>
                <View style={styles.inputContainer}>
                  <DropDownPicker
                    open={activeStatusOpen}
                    value={activeStatusValue}
                    items={[
                      { label: 'Active', value: '1' },
                      { label: 'Inactive', value: '0' },
                    ]}
                    setOpen={setActiveStatusOpen}
                    setValue={(callback) => {
                      const value = callback(activeStatusValue);
                      setActiveStatusValue(value);
                      handleInputChange('active', value);
                    }}
                    listMode="SCROLLVIEW"
                    placeholder="Select Status"
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownContainer}
                    placeholderStyle={styles.placeholderStyle}
                    textStyle={styles.textStyle}
                  />
                </View>

               
                <Text style={styles.label}>Change Password</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      formErrors.password && styles.inputError,
                    ]}
                    placeholder="Enter new password"
                    placeholderTextColor="#7C7C7C"
                    value={password}
                    onChangeText={(text) => setPassword(text)}
                    secureTextEntry={true}
                  />
                  {formErrors.password && (
                    <Tooltip message={formErrors.password[0]}>
                      <TouchableOpacity style={styles.errorIconContainer}>
                        <AntDesign
                          name="exclamationcircleo"
                          size={20}
                          color="red"
                        />
                      </TouchableOpacity>
                    </Tooltip>
                  )}
                </View>

           
                <TouchableOpacity
                  style={[
                    styles.changePassButton,
                    { opacity: isChangingPassword ? 0.6 : 1 },
                  ]}
                  onPress={handleChangePassword}
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.changePassButtonText}>
                      Change Password
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveUser}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

     
      {showSuccessModal && (
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
                {successMessage || 'Operation completed successfully.'}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    fontFamily: 'OpenSans-Bold',
    textAlign: 'center',
  },
  editUserButton: {
    backgroundColor: '#8B0000',
    padding: 10,
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 10,
  },
  editUserButtonText: {
    color: '#fff',
    fontFamily: 'OpenSans-Bold',
    fontSize: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 5,
    marginBottom: 10,
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
  },
  searchInputFocused: {
    borderColor: '#2A47CB',
    backgroundColor: '#F0F8FF',
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#00001A',
    paddingVertical: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  headerCell: {
    width: 100,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 5,
    fontFamily: 'OpenSans-Regular',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  selectedUserRow: {
    backgroundColor: '#cce5ff',
  },
  cell: {
    width: 100,
    textAlign: 'center',
    paddingHorizontal: 5,
    fontFamily: 'OpenSans-Regular',
  },
  noResults: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'OpenSans-Regular',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  paginationButton: {
    padding: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pageNumbersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageNumberButton: {
    marginHorizontal: 3,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#f1f1f1',
  },
  currentPageButton: {
    backgroundColor: '#00001A',
  },
  pageNumberText: {
    color: '#2A47CB',
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
  },
  currentPageText: {
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'OpenSans-Regular',
  },
  ellipsisText: {
    fontSize: 16,
    marginHorizontal: 5,
    color: '#333',
    fontFamily: 'OpenSans-Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainerEdit: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    maxHeight: '90%',
    elevation: 10,
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
    fontFamily: 'OpenSans-Regular',
  },
  changePassButton: {
    backgroundColor: '#041435',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 15,
  },
  changePassButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'OpenSans-Regular',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'OpenSans-Regular',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
    fontFamily: 'OpenSans-Bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    height: 45,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#DADCE0',
    borderRadius: 8,
    backgroundColor: '#F7F8FA',
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    color: '#000',
  },
  inputError: {
    borderColor: 'red',
  },
  errorIconContainer: {
    marginLeft: 5,
  },
  dropdown: {
    backgroundColor: '#F7F8FA',
    borderColor: '#DADCE0',
    borderWidth: 1,
    borderRadius: 8,
    flex: 1,
  },
  dropdownContainer: {
    borderColor: '#DADCE0',
    borderRadius: 8,
  },
  placeholderStyle: {
    color: '#7C7C7C',
    fontFamily: 'OpenSans-Regular',
  },
  textStyle: {
    color: '#000',
    fontFamily: 'OpenSans-Regular',
  },
  saveButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 15,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'OpenSans-Regular',
  },
  cancelButton: {
    backgroundColor: '#A52A2A',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 20,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'OpenSans-Regular',
  },
  errorText: {
    color: 'red',
    marginBottom: 5,
    fontFamily: 'OpenSans-Regular',
  },
});
