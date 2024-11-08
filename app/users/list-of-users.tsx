import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DropDownPicker from 'react-native-dropdown-picker';
import { AntDesign } from '@expo/vector-icons';
import { useFonts, OpenSans_400Regular } from '@expo-google-fonts/open-sans';

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
}

interface Department {
  label: string;
  value: string;
}

export default function ListOfUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const usersPerPage = 10;

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
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

  // Load Open Sans font
  const [fontsLoaded] = useFonts({
    OpenSans_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      fetchDepartments();
      fetchUsers();
    }
  }, [fontsLoaded]);

  // Fetch users from the API
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
      const departmentsArray = Object.values(departmentsData).map((dept: any) => ({
        label: dept.dept_description,
        value: dept.dept_code,
      }));
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

  // Updated filteredUsers for enhanced search functionality
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
      <Text style={styles.cell}>{item.active === '1' ? 'Active' : 'Inactive'}</Text>
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
        setShowEditModal(true);
      }
    } else {
      Alert.alert('Selection Required', 'Please select a user to edit.');
    }
  };

  const handleSaveUser = async () => {
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


  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#2A47CB" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>List of Users</Text>
      <TouchableOpacity
        style={[
          styles.editUserButton,
          { backgroundColor: selectedUserId ? '#2A47CB' : '#ccc' },
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
            color={
              currentPage === 1 || totalPages === 0 ? '#ccc' : '#2A47CB'
            }
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

      {/* Edit User Modal */}
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
            <View style={styles.modalContainer}>
              <ScrollView>
                <Text style={styles.modalTitle}>Edit User</Text>

                {/* Form fields */}
                {/* First Name */}
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  value={formData.name}
                  onChangeText={(text) => handleInputChange('name', text)}
                />
                {formErrors.name && (
                  <Text style={styles.errorText}>{formErrors.name[0]}</Text>
                )}

             
                <Text style={styles.label}>Middle Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Middle Name"
                  value={formData.middle_name}
                  onChangeText={(text) => handleInputChange('middle_name', text)}
                />
                {formErrors.middle_name && (
                  <Text style={styles.errorText}>{formErrors.middle_name[0]}</Text>
                )}

                
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  value={formData.last_name}
                  onChangeText={(text) => handleInputChange('last_name', text)}
                />
                {formErrors.last_name && (
                  <Text style={styles.errorText}>{formErrors.last_name[0]}</Text>
                )}

                
                <Text style={styles.label}>Suffix</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Suffix"
                  value={formData.suffix}
                  onChangeText={(text) => handleInputChange('suffix', text)}
                />
                {formErrors.suffix && (
                  <Text style={styles.errorText}>{formErrors.suffix[0]}</Text>
                )}

                
                <Text style={styles.label}>Assigned Office/Department</Text>
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
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                />
                {formErrors.office_dept && (
                  <Text style={styles.errorText}>{formErrors.office_dept[0]}</Text>
                )}

                
                <Text style={styles.label}>Designation</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Designation"
                  value={formData.designation}
                  onChangeText={(text) => handleInputChange('designation', text)}
                />
                {formErrors.designation && (
                  <Text style={styles.errorText}>{formErrors.designation[0]}</Text>
                )}

                {/* Contact */}
                <Text style={styles.label}>Contact</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contact Number"
                  value={formData.contact}
                  onChangeText={(text) => handleInputChange('contact', text)}
                />
                {formErrors.contact && (
                  <Text style={styles.errorText}>{formErrors.contact[0]}</Text>
                )}

                {/* Username */}
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  value={formData.username}
                  onChangeText={(text) => handleInputChange('username', text)}
                />
                {formErrors.username && (
                  <Text style={styles.errorText}>{formErrors.username[0]}</Text>
                )}

                {/* User Level */}
                <Text style={styles.label}>User Level</Text>
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
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                />
                {formErrors.user_level && (
                  <Text style={styles.errorText}>{formErrors.user_level[0]}</Text>
                )}

                {/* Active Status */}
                <Text style={styles.label}>Active Status</Text>
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
                />
                {formErrors.active && (
                  <Text style={styles.errorText}>{formErrors.active[0]}</Text>
                )}

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveUser}>
                  <Text style={styles.saveButtonText}>Save</Text>
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
          animationType="slide"
          transparent={true}
          visible={showSuccessModal}
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.successTitle}>Success</Text>
              <Text style={styles.successMessage}>
                User information has been successfully updated.
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
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'OpenSans_400Regular',
    textAlign: 'center'
  },
  editUserButton: {
    backgroundColor: '#809fff',
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 10,
  },
  editUserButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'OpenSans_400Regular',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 5,
    marginBottom: 10,
    fontSize: 16,
    fontFamily: 'OpenSans_400Regular',
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
    fontFamily: 'OpenSans_400Regular',
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
    fontFamily: 'OpenSans_400Regular',
  },
  noResults: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'OpenSans_400Regular',
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
    fontFamily: 'OpenSans_400Regular',
  },
  currentPageText: {
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'OpenSans_400Regular',
  },
  ellipsisText: {
    fontSize: 16,
    marginHorizontal: 5,
    color: '#333',
    fontFamily: 'OpenSans_400Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2A47CB',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'OpenSans_400Regular',
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
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
    fontFamily: 'OpenSans_400Regular',
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
    marginBottom: 10,
    fontFamily: 'OpenSans_400Regular',
  },
  dropdown: {
    borderColor: '#DADCE0',
    borderRadius: 8,
    marginBottom: 10,
    fontFamily: 'OpenSans_400Regular',
  },
  dropdownContainer: {
    borderColor: '#DADCE0',
  },
  saveButton: {
    backgroundColor: '#2A47CB',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 15,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'OpenSans_400Regular',
  },
  cancelButton: {
    backgroundColor: '#f1f1f1',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 20,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
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
  errorText: {
    color: 'red',
    marginBottom: 5,
    fontFamily: 'OpenSans_400Regular',
  },
});
