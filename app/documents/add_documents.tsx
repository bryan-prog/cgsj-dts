import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker'; // Import Picker

// Define the shape of the error object returned by the API
interface APIError {
  doctitle?: string[];
  doctype?: string[];
  docsubj?: string[];
  urgency?: string[];
  remarks?: string[]; // Added Remarks to APIError
  status?: string[];
}

// Define the props for AddDocumentModal
interface AddDocumentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddDocumentModal: React.FC<AddDocumentModalProps> = ({ visible, onClose, onSuccess }) => {
  
  const [doctitle, setDoctitle] = useState<string>('');
  const [doctype, setDoctype] = useState<string>('----'); // Default to '----'
  const [docsubj, setDocsubj] = useState<string>('----'); // Default to '----'
  const [urgency, setUrgency] = useState<string>('');
  const [remarks, setRemarks] = useState<string>(''); // New state for Remarks

  const [errors, setErrors] = useState<APIError>({});

  // Separate loading states for each button
  const [loadingSaveDraft, setLoadingSaveDraft] = useState<boolean>(false);
  const [loadingAddDocument, setLoadingAddDocument] = useState<boolean>(false);

  // State to hold fetched doctypes and docsubj
  const [doctypesData, setDoctypesData] = useState<Array<{ id: number; doc_type: string; code: string }>>([]);
  const [docsubjData, setDocsubjData] = useState<Array<{ id: number; doc_subject: string }>>([]);
  const [fetchingData, setFetchingData] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string>('');

  // Fetch doctypes and docsubj from API when component mounts or becomes visible
  useEffect(() => {
    if (visible) {
      fetchDropdownData();
    }
  }, [visible]);

  const fetchDropdownData = async () => {
    setFetchingData(true);
    setFetchError('');
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('No authorization token found.');
      }

      const response = await axios.get('http://dts.sanjuancity.gov.ph/api/my_documents', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: 'application/json',
        },
      });

      const { doctypes, docsubj } = response.data;

      setDoctypesData(doctypes);
      setDocsubjData(docsubj);

      // Reset selections when modal opens
      setDoctype('----');
      setDocsubj('----');
    } catch (error: any) {
      console.error('Error fetching dropdown data:', error);
      if (error.message === 'No authorization token found.') {
        setFetchError('Authorization token is missing. Please log in again.');
      } else if (error.response && error.response.status === 401) {
        setFetchError('Unauthorized access. Please check your credentials.');
      } else {
        setFetchError('Failed to load dropdown data. Please try again.');
      }
    } finally {
      setFetchingData(false);
    }
  };

  const handleSubmit = async (status: number, action: 'saveDraft' | 'addDocument') => {
    // Reset errors
    setErrors({});

    // Set the appropriate loading state
    if (action === 'saveDraft') {
      setLoadingSaveDraft(true);
    } else if (action === 'addDocument') {
      setLoadingAddDocument(true);
    }

    // Prepare data to be sent
    const data = {
      doctitle: doctitle.trim() || '', // Send as empty string if empty
      doctype, // Send '----' or selected code
      docsubj, // Send '----' or selected subject
      urgency: urgency.trim() || '', // Send as empty string if empty
      remarks: remarks.trim() || '', // Send as empty string if empty
      status,
    };

    try {
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('No authorization token found.');
      }

      const response = await axios.post(
        'http://dts.sanjuancity.gov.ph/api/save-add-doc',
        data,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json', // Changed to 'application/json' since data is JSON
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', 'Document added successfully.');
        onSuccess();
        onClose();
        // Reset form fields
        setDoctitle('');
        setDoctype('----');
        setDocsubj('----');
        setUrgency('');
        setRemarks(''); // Reset Remarks
      } else {
        throw new Error('Failed to add document.');
      }
    } catch (error: any) {
      console.error('Error submitting document:', error);
      if (error.message === 'No authorization token found.') {
        Alert.alert('Error', 'Authorization token is missing. Please log in again.');
      } else if (error.response && error.response.status === 401) {
        Alert.alert('Error', 'Unauthorized access. Please check your credentials.');
      } else if (error.response && error.response.data && error.response.data.errors) {
        setErrors(error.response.data.errors as APIError);
      } else {
        Alert.alert('Error', error.message || 'An error occurred.');
      }
    } finally {
    
      if (action === 'saveDraft') {
        setLoadingSaveDraft(false);
      } else if (action === 'addDocument') {
        setLoadingAddDocument(false);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose} 
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.modalTitle}>Add New Document</Text>

           
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Document Title</Text>
              <TextInput
                style={[styles.input, errors.doctitle && styles.inputError]}
                value={doctitle}
                onChangeText={setDoctitle}
                placeholder="Enter Document Title"
                placeholderTextColor="#999"
              />
              {errors.doctitle && <Text style={styles.errorText}>{errors.doctitle[0]}</Text>}
            </View>

            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Document Type</Text>
              {fetchingData ? (
                <ActivityIndicator size="small" color="#000" />
              ) : fetchError ? (
                <Text style={styles.errorText}>{fetchError}</Text>
              ) : (
                <View style={[styles.pickerContainer, errors.doctype && styles.inputError]}>
                  <Picker
                    selectedValue={doctype}
                    onValueChange={(itemValue) => setDoctype(itemValue)}
                    style={styles.picker}
                    dropdownIconColor="#333"
                    accessibilityLabel="Select Document Type" 
                  >
                    <Picker.Item label="----" value="----" />
                    {doctypesData.map((dt) => (
                      <Picker.Item key={dt.id} label={dt.doc_type} value={dt.code} />
                    ))}
                  </Picker>
                </View>
              )}
              {errors.doctype && <Text style={styles.errorText}>{errors.doctype[0]}</Text>}
            </View>

         
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Document Subject</Text>
              {fetchingData ? (
                <ActivityIndicator size="small" color="#000" />
              ) : fetchError ? (
                <Text style={styles.errorText}>{fetchError}</Text>
              ) : (
                <View style={[styles.pickerContainer, errors.docsubj && styles.inputError]}>
                  <Picker
                    selectedValue={docsubj}
                    onValueChange={(itemValue) => setDocsubj(itemValue)}
                    style={styles.picker}
                    dropdownIconColor="#333"
                    accessibilityLabel="Select Document Subject" 
                  >
                    <Picker.Item label="----" value="----" />
                    {docsubjData.map((ds) => (
                      <Picker.Item key={ds.id} label={ds.doc_subject} value={ds.doc_subject} />
                    ))}
                  </Picker>
                </View>
              )}
              {errors.docsubj && <Text style={styles.errorText}>{errors.docsubj[0]}</Text>}
            </View>

            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Urgency</Text>
              <TextInput
                style={[styles.input, errors.urgency && styles.inputError]}
                value={urgency}
                onChangeText={setUrgency}
                placeholder="Enter Urgency"
                placeholderTextColor="#999"
              />
              {errors.urgency && <Text style={styles.errorText}>{errors.urgency[0]}</Text>}
            </View>

          
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Remarks</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.remarksInput, 
                  errors.remarks && styles.inputError,
                ]}
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Enter Remarks"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4} 
                textAlignVertical="top" 
              />
              {errors.remarks && <Text style={styles.errorText}>{errors.remarks[0]}</Text>}
            </View>

          
            <View style={styles.buttonContainer}>
             
              <TouchableOpacity
                style={[styles.button, styles.saveDraftButton]}
                onPress={() => handleSubmit(2, 'saveDraft')}
                disabled={loadingSaveDraft} 
              >
                {loadingSaveDraft ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Save as Draft</Text>
                )}
              </TouchableOpacity>

              
              <TouchableOpacity
                style={[styles.button, styles.addButton]}
                onPress={() => handleSubmit(1, 'addDocument')}
                disabled={loadingAddDocument} 
              >
                {loadingAddDocument ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Add Document</Text>
                )}
              </TouchableOpacity>
            </View>

          
            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default AddDocumentModal;

// Styles
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '90%',
    position: 'relative',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'OpenSans-Bold',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    fontFamily: 'OpenSans-Bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#F9F9F9',
    fontFamily: 'OpenSans-Regular',
  },
  remarksInput: {
    height: 90, 
    paddingTop: 10, 
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#333',
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'OpenSans-Regular',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  saveDraftButton: {
    backgroundColor: '#FFA500',
  },
  addButton: {
    backgroundColor: '#17B169',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'OpenSans-Bold',
  },
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
});
