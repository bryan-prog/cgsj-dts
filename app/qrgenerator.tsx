// // QRGenerator.js

// import React, { useState, useEffect, useRef } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   FlatList,
//   ScrollView,
//   TextInput,
//   Modal,
//   Alert,
//   ActivityIndicator,
//   Animated,
//   Easing,
// } from 'react-native';
// import { Picker } from '@react-native-picker/picker';
// import { AntDesign } from '@expo/vector-icons';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import * as Print from 'expo-print';
// import * as Sharing from 'expo-sharing';

// const QRGenerator = () => {
//   // State Variables
//   const [selectedOffice, setSelectedOffice] = useState('');
//   const [offices, setOffices] = useState([]);
//   const [qrData, setQrData] = useState([]); // Ensure it's initialized as an array
//   const [selectedSeries, setSelectedSeries] = useState(null);
//   const [isAssignModalVisible, setAssignModalVisible] = useState(false);
//   const [forMonthYear, setForMonthYear] = useState('');
//   const [amount, setAmount] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [datePickerVisible, setDatePickerVisible] = useState(false);
//   const [showSuccessModal, setShowSuccessModal] = useState(false);
//   const [successMessage, setSuccessMessage] = useState('');

//   // Success Modal Animation
//   const modalScaleAnim = useRef(new Animated.Value(0)).current;
//   const modalOpacityAnim = useRef(new Animated.Value(0)).current;

//   // Pagination States
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 10;

//   // Fetch Offices on Mount
//   useEffect(() => {
//     fetchOffices();
//   }, []);

//   // Fetch QR Data when selectedOffice changes
//   useEffect(() => {
//     if (selectedOffice) {
//       fetchQRData();
//     } else {
//       setQrData([]);
//     }
//   }, [selectedOffice]);

//   // Handle Success Modal Animation
//   useEffect(() => {
//     if (showSuccessModal) {
//       Animated.parallel([
//         Animated.timing(modalScaleAnim, {
//           toValue: 1,
//           duration: 300,
//           easing: Easing.out(Easing.ease),
//           useNativeDriver: true,
//         }),
//         Animated.timing(modalOpacityAnim, {
//           toValue: 1,
//           duration: 300,
//           easing: Easing.out(Easing.ease),
//           useNativeDriver: true,
//         }),
//       ]).start();
//     } else {
//       modalScaleAnim.setValue(0);
//       modalOpacityAnim.setValue(0);
//     }
//   }, [showSuccessModal]);

//   // Function to Fetch Offices
//   const fetchOffices = async () => {
//     try {
//       const authToken = await AsyncStorage.getItem('authToken');
//       if (!authToken) {
//         throw new Error('No authorization token found');
//       }

//       const response = await axios.get(
//         'http://dts.sanjuancity.gov.ph/api/department', 
//         {
//           headers: {
//             Authorization: `Bearer ${authToken}`,
//           },
//         }
//       );

//       console.log('Departments Response:', response.data); 

//       if (response.data && response.data.office) {
//         const officesArray = Object.values(response.data.office).map((office) => ({
//           label: office.dept_description,
//           value: office.dept_code,
//         }));
//         setOffices(officesArray);
//       } else {
//         console.error('Office data not found in response');
//         Alert.alert('Error', 'Unable to fetch office data.');
//       }
//     } catch (error) {
//       console.error('Error fetching offices:', error);
//       Alert.alert(
//         'Error',
//         'An error occurred while fetching offices. Please try again later.'
//       );
//     }
//   };

//   // Function to Fetch QR Data
//   const fetchQRData = async () => {
//     try {
//       setLoading(true);
//       const authToken = await AsyncStorage.getItem('authToken');
//       if (!authToken) {
//         throw new Error('No authorization token found');
//       }

//       const response = await axios.get(
//         `http://dts.sanjuancity.gov.ph/api/qr-office-list/${selectedOffice}`,
//         {
//           headers: {
//             Authorization: `Bearer ${authToken}`,
//           },
//         }
//       );

//       console.log('QR Data Response:', response.data); // Debugging Line

//       let qrArray = [];

//       if (response.status === 200) {
//         // Scenario 1: Direct Array
//         if (Array.isArray(response.data)) {
//           qrArray = response.data;
//         }
//         // Scenario 2: Wrapped in 'data'
//         else if (response.data.data && Array.isArray(response.data.data)) {
//           qrArray = response.data.data;
//         }
//         // Scenario 3: Nested under 'qr' with dynamic keys
//         else if (response.data.qr && typeof response.data.qr === 'object') {
//           qrArray = Object.values(response.data.qr);
//         }
//         // Scenario 4: Other nested structures
//         else if (response.data && typeof response.data === 'object') {
//           // Manually map based on known structure
//           // Example: If QR data is under 'records'
//           if (response.data.records && Array.isArray(response.data.records)) {
//             qrArray = response.data.records;
//           }
//           // Add more conditions as needed
//           else {
//             console.warn('Unexpected QR Data Structure:', response.data);
//             Alert.alert('Error', 'Unexpected QR data format received.');
//             setQrData([]);
//             return;
//           }
//         }
//         // If none of the above, assume unexpected structure
//         else {
//           console.warn('Unexpected QR Data Structure:', response.data);
//           Alert.alert('Error', 'Unexpected QR data format received.');
//           setQrData([]);
//           return;
//         }

//         setQrData(qrArray);
//         setCurrentPage(1);
//       } else {
//         console.error('Error fetching QR data:', response.data.message);
//         setQrData([]);
//         Alert.alert('Error', 'Unable to fetch QR data.');
//       }
//     } catch (error) {
//       console.error('Error fetching QR data:', error);
//       setQrData([]);
//       Alert.alert('Error', 'An error occurred while fetching QR data.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Function to Assign New QR Codes
//   const handleAssignNewQRCodes = async () => {
//     if (!forMonthYear || !amount) {
//       Alert.alert('Validation Error', 'Please fill all the fields.');
//       return;
//     }

//     try {
//       const authToken = await AsyncStorage.getItem('authToken');
//       if (!authToken) {
//         throw new Error('No authorization token found');
//       }

//       const postData = {
//         selected_office: selectedOffice,
//         amount: parseInt(amount),
//         for_month_year: forMonthYear,
//       };

//       const response = await axios.post(
//         'http://dts.sanjuancity.gov.ph/api/assign-new-qr-series',
//         postData,
//         {
//           headers: {
//             Authorization: `Bearer ${authToken}`,
//             'Content-Type': 'application/json',
//             Accept: 'application/json',
//           },
//         }
//       );

//       console.log('Assign QR Response:', response.data); // Debugging Line

//       if (response.status === 201 || response.status === 200) {
//         setSuccessMessage('QR codes assigned successfully.');
//         setShowSuccessModal(true);
//         setAssignModalVisible(false);
//         setForMonthYear('');
//         setAmount('');
//         fetchQRData();
//       } else if (response.data.errors) {
//         let errorMessages = '';
//         for (let key in response.data.errors) {
//           errorMessages += response.data.errors[key].join('\n') + '\n';
//         }
//         Alert.alert('Error', errorMessages);
//       } else {
//         Alert.alert('Error', response.data.message || 'An unexpected error occurred.');
//       }
//     } catch (error) {
//       console.error('Error assigning new QR codes:', error);
//       if (
//         error.response &&
//         error.response.data &&
//         error.response.data.message
//       ) {
//         Alert.alert('Error', error.response.data.message);
//       } else {
//         Alert.alert('Error', 'An error occurred while assigning QR codes.');
//       }
//     }
//   };

//   // Function to Handle Date Change
//   const handleDateChange = (event, selectedDate) => {
//     setDatePickerVisible(false);
//     if (selectedDate) {
//       const date = selectedDate.toISOString().split('T')[0];
//       setForMonthYear(date);
//     }
//   };

//   // Function to Handle Print Series
//   const handlePrintSeries = async () => {
//     if (!selectedSeries) {
//       Alert.alert('Selection Error', 'Please select a series first!');
//       return;
//     }

//     try {
//       const authToken = await AsyncStorage.getItem('authToken');
//       if (!authToken) {
//         throw new Error('No authorization token found');
//       }

//       const response = await axios.get(
//         `http://dts.sanjuancity.gov.ph/print-qr-series/${selectedSeries}/${selectedOffice}`,
//         {
//           headers: {
//             Authorization: `Bearer ${authToken}`,
//           },
//         }
//       );

//       console.log('Print QR Series Response:', response.data); // Debugging Line

//       if (response.status === 200) {
//         const htmlContent = generatePrintableHTML(response.data);
//         const { uri } = await Print.printToFileAsync({ html: htmlContent });
//         await Sharing.shareAsync(uri);
//       } else {
//         Alert.alert('Error', 'Unable to fetch print data.');
//       }
//     } catch (error) {
//       console.error('Error printing QR series:', error);
//       Alert.alert('Error', 'An error occurred while printing QR series.');
//     }
//   };

//   // Function to Generate Printable HTML
//   const generatePrintableHTML = (data) => {
//     // Customize the HTML as per your print requirements
//     return `
//       <html>
//         <head>
//           <title>QR Series Print</title>
//           <style>
//             body { font-family: Arial, sans-serif; padding: 20px; }
//             table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
//             th, td { border: 1px solid #000; padding: 8px; text-align: center; }
//             th { background-color: #f2f2f2; }
//           </style>
//         </head>
//         <body>
//           <h2>QR Series: ${data.series || 'N/A'}</h2>
//           <p>Office: ${data.office || 'N/A'}</p>
//           <p>For Month/Year: ${
//             data.for_month_year
//               ? new Date(`${data.for_month_year}-01`).toLocaleDateString('en-CA', {
//                   year: 'numeric',
//                   month: 'long',
//                 })
//               : 'N/A'
//           }</p>
//           <table>
//             <tr>
//               <th>Series</th>
//               <th>Initial Count</th>
//               <th>Remaining</th>
//               <th>Used</th>
//             </tr>
//             <tr>
//               <td>${data.series || 'N/A'}</td>
//               <td>${data.initial_count || 0}</td>
//               <td>${data.remaining || 0}</td>
//               <td>${data.used || 0}</td>
//             </tr>
//           </table>
//         </body>
//       </html>
//     `;
//   };

//   // Pagination Logic
//   const totalPages = Math.ceil(qrData.length / itemsPerPage);
//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentData = qrData.slice(indexOfFirstItem, indexOfLastItem);

//   const handleNextPage = () => {
//     if (currentPage < totalPages) {
//       setCurrentPage((prevPage) => prevPage + 1);
//       setSelectedSeries(null);
//     }
//   };

//   const handlePreviousPage = () => {
//     if (currentPage > 1) {
//       setCurrentPage((prevPage) => prevPage - 1);
//       setSelectedSeries(null);
//     }
//   };

//   const handlePageChange = (pageNumber) => {
//     setCurrentPage(pageNumber);
//     setSelectedSeries(null);
//   };

//   const generatePageNumbers = () => {
//     const pageNumbers = [];
//     const totalNumbers = 5;
//     const halfTotalNumbers = Math.floor(totalNumbers / 2);

//     let startPage = Math.max(2, currentPage - halfTotalNumbers);
//     let endPage = Math.min(totalPages - 1, currentPage + halfTotalNumbers);

//     if (currentPage <= halfTotalNumbers) {
//       endPage = totalNumbers;
//     }

//     if (currentPage + halfTotalNumbers >= totalPages) {
//       startPage = totalPages - totalNumbers + 1;
//     }

//     startPage = Math.max(startPage, 2);
//     endPage = Math.min(endPage, totalPages - 1);

//     pageNumbers.push(1);

//     if (startPage > 2) {
//       pageNumbers.push('left-ellipsis');
//     }

//     for (let i = startPage; i <= endPage; i++) {
//       pageNumbers.push(i);
//     }

//     if (endPage < totalPages - 1) {
//       pageNumbers.push('right-ellipsis');
//     }

//     if (totalPages > 1) {
//       pageNumbers.push(totalPages);
//     }

//     return pageNumbers;
//   };

//   const pageNumbers = generatePageNumbers();

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.title}>QR Generator</Text>
//       </View>

//       {/* Card Container */}
//       <View style={styles.card}>
//         <Text style={styles.sectionTitle}>Assign QR to Office</Text>

//         {/* Office Picker */}
//         <Text style={styles.label}>Select Office:</Text>
//         <View style={styles.dropdownContainer}>
//           <Picker
//             selectedValue={selectedOffice}
//             onValueChange={(value) => setSelectedOffice(value)}
//             style={styles.dropdown}
//           >
//             <Picker.Item label="----" value="" />
//             {offices.map((office) => (
//               <Picker.Item
//                 key={office.value}
//                 label={office.label}
//                 value={office.value}
//               />
//             ))}
//           </Picker>
//         </View>

//         {/* Buttons */}
//         <View style={styles.buttonContainer}>
//           <TouchableOpacity
//             style={styles.primaryButton}
//             onPress={() => {
//               if (!selectedOffice) {
//                 Alert.alert('Validation Error', 'Please select an office first!');
//                 return;
//               }
//               setAssignModalVisible(true);
//             }}
//           >
//             <Text style={styles.buttonText}>Assign New QR Codes</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={styles.secondaryButton}
//             onPress={handlePrintSeries}
//           >
//             <Text style={styles.buttonText}>Print Series</Text>
//           </TouchableOpacity>
//         </View>

//         {/* QR Data Table */}
//         {loading ? (
//           <ActivityIndicator size="large" color="#2A47CB" />
//         ) : (
//           <ScrollView horizontal>
//             <View>
//               {/* Table Header */}
//               <View style={styles.headerRow}>
//                 <Text style={styles.headerCell}>Office</Text>
//                 <Text style={styles.headerCell}>For Month/Year</Text>
//                 <Text style={styles.headerCell}>Series</Text>
//                 <Text style={styles.headerCell}>Initial Count</Text>
//                 <Text style={styles.headerCell}>Remaining</Text>
//                 <Text style={styles.headerCell}>Used</Text>
//               </View>

//               {/* Table Rows */}
//               <FlatList
//                 data={currentData}
//                 renderItem={({ item }) => (
//                   <TouchableOpacity
//                     style={[
//                       styles.dataRow,
//                       selectedSeries === item.series && styles.selectedRow,
//                     ]}
//                     onPress={() => setSelectedSeries(item.series)}
//                   >
//                     <Text style={styles.cell}>{item.office || 'N/A'}</Text>
//                     <Text style={styles.cell}>
//                       {item.for_month_year
//                         ? new Date(`${item.for_month_year}-01`).toLocaleDateString('en-CA', {
//                             year: 'numeric',
//                             month: 'long',
//                           })
//                         : 'N/A'}
//                     </Text>
//                     <Text style={styles.cell}>{item.series || 'N/A'}</Text>
//                     <Text style={styles.cell}>{item.initial_count || 0}</Text>
//                     <Text style={styles.cell}>{item.remaining || 0}</Text>
//                     <Text style={styles.cell}>{item.used || 0}</Text>
//                   </TouchableOpacity>
//                 )}
//                 keyExtractor={(item, index) => index.toString()}
//                 ListEmptyComponent={() => (
//                   <View style={styles.noResults}>
//                     <Text style={styles.noResultsText}>No data found.</Text>
//                   </View>
//                 )}
//               />
//             </View>
//           </ScrollView>
//         )}

//         {/* Pagination */}
//         {totalPages > 1 && (
//           <View style={styles.paginationContainer}>
//             <TouchableOpacity
//               onPress={handlePreviousPage}
//               disabled={currentPage === 1}
//               style={[
//                 styles.paginationButton,
//                 currentPage === 1 && styles.disabledPaginationButton,
//               ]}
//             >
//               <AntDesign
//                 name="left"
//                 size={20}
//                 color={currentPage === 1 ? '#ccc' : '#2A47CB'}
//               />
//             </TouchableOpacity>

//             <View style={styles.pageNumbersContainer}>
//               {pageNumbers.map((number, index) => {
//                 if (number === 'left-ellipsis' || number === 'right-ellipsis') {
//                   return (
//                     <Text key={index} style={styles.ellipsisText}>
//                       ...
//                     </Text>
//                   );
//                 } else {
//                   return (
//                     <TouchableOpacity
//                       key={index}
//                       onPress={() => handlePageChange(number)}
//                       style={[
//                         styles.pageNumberButton,
//                         currentPage === number && styles.currentPageButton,
//                       ]}
//                     >
//                       <Text
//                         style={[
//                           styles.pageNumberText,
//                           currentPage === number && styles.currentPageText,
//                         ]}
//                       >
//                         {number}
//                       </Text>
//                     </TouchableOpacity>
//                   );
//                 }
//               })}
//             </View>

//             <TouchableOpacity
//               onPress={handleNextPage}
//               disabled={currentPage === totalPages}
//               style={[
//                 styles.paginationButton,
//                 currentPage === totalPages && styles.disabledPaginationButton,
//               ]}
//             >
//               <AntDesign
//                 name="right"
//                 size={20}
//                 color={currentPage === totalPages ? '#ccc' : '#2A47CB'}
//               />
//             </TouchableOpacity>
//           </View>
//         )}
//       </View>

//       {/* Assign QR Codes Modal */}
//       <Modal
//         animationType="fade"
//         transparent={true}
//         visible={isAssignModalVisible}
//         onRequestClose={() => {
//           setAssignModalVisible(false);
//         }}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContainer}>
//             <ScrollView>
//               <Text style={styles.modalTitle}>Assign New QR Series</Text>

//               {/* Office (Read-Only) */}
//               <Text style={styles.label}>Office</Text>
//               <TextInput
//                 style={[styles.input, { backgroundColor: '#e9ecef' }]}
//                 value={selectedOffice}
//                 editable={false}
//               />

//               {/* For Month/Year */}
//               <Text style={styles.label}>For Month/Year</Text>
//               <TouchableOpacity
//                 onPress={() => setDatePickerVisible(true)}
//                 style={styles.dateInput}
//               >
//                 <Text style={styles.dateInputText}>
//                   {forMonthYear || 'Select Date'}
//                 </Text>
//               </TouchableOpacity>
//               {datePickerVisible && (
//                 <DateTimePicker
//                   value={forMonthYear ? new Date(forMonthYear) : new Date()}
//                   mode="date"
//                   display="default"
//                   onChange={handleDateChange}
//                 />
//               )}

//               {/* Amount to Assign */}
//               <Text style={styles.label}>Amount to be Assigned</Text>
//               <TextInput
//                 style={styles.input}
//                 value={amount}
//                 onChangeText={(text) => {
//                   const num = parseInt(text);
//                   if (num > 50) {
//                     setAmount('50');
//                   } else {
//                     setAmount(text);
//                   }
//                 }}
//                 placeholder="Amount"
//                 keyboardType="numeric"
//               />

//               {/* Buttons */}
//               <TouchableOpacity
//                 style={styles.saveButton}
//                 onPress={handleAssignNewQRCodes}
//               >
//                 <Text style={styles.saveButtonText}>Apply</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={styles.cancelButton}
//                 onPress={() => setAssignModalVisible(false)}
//               >
//                 <Text style={styles.cancelButtonText}>Close</Text>
//               </TouchableOpacity>
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>

//       {/* Success Modal */}
//       <Modal
//         transparent={true}
//         visible={showSuccessModal}
//         animationType="none"
//         onRequestClose={() => setShowSuccessModal(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <Animated.View
//             style={[
//               styles.modalContainer,
//               {
//                 opacity: modalOpacityAnim,
//                 transform: [
//                   {
//                     scale: modalScaleAnim.interpolate({
//                       inputRange: [0, 1],
//                       outputRange: [0.8, 1],
//                     }),
//                   },
//                 ],
//               },
//             ]}
//           >
//             <AntDesign
//               name="checkcircle"
//               size={80}
//               color="#28a745"
//               style={styles.successIcon}
//             />
//             <Text style={styles.successTitle}>Success</Text>
//             <Text style={styles.successMessage}>
//               {successMessage || 'QR codes assigned successfully.'}
//             </Text>
//             <TouchableOpacity
//               style={styles.closeButton}
//               onPress={() => setShowSuccessModal(false)}
//             >
//               <Text style={styles.closeButtonText}>Close</Text>
//             </TouchableOpacity>
//           </Animated.View>
//         </View>
//       </Modal>
//     </View>
//   );
// };

// // Stylesheet
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     paddingTop: 20,
//   },
//   header: {
//     alignItems: 'center',
//     backgroundColor: '#16213E',
//     paddingVertical: 16,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   card: {
//     flex: 1,
//     backgroundColor: '#fff',
//     margin: 16,
//     borderRadius: 10,
//     padding: 16,
//     elevation: 5,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 16,
//     color: '#333',
//     textAlign: 'center',
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 8,
//   },
//   dropdownContainer: {
//     borderWidth: 1,
//     borderColor: '#DADCE0',
//     borderRadius: 8,
//     overflow: 'hidden',
//     marginBottom: 16,
//     backgroundColor: '#F7F8FA',
//   },
//   dropdown: {
//     height: 50,
//     backgroundColor: '#F7F8FA',
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//     marginBottom: 16,
//   },
//   primaryButton: {
//     backgroundColor: '#008080',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 8,
//     marginRight: 8,
//   },
//   secondaryButton: {
//     backgroundColor: '#A52A2A',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 8,
//   },
//   buttonText: {
//     color: '#fff',
//     fontWeight: '600',
//     fontSize: 16,
//   },
//   headerRow: {
//     flexDirection: 'row',
//     backgroundColor: '#00001A',
//     paddingVertical: 10,
//     borderTopLeftRadius: 10,
//     borderTopRightRadius: 10,
//   },
//   headerCell: {
//     width: 120,
//     color: '#fff',
//     fontWeight: 'bold',
//     textAlign: 'center',
//     paddingHorizontal: 5,
//   },
//   dataRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#ccc',
//   },
//   selectedRow: {
//     backgroundColor: '#cce5ff',
//   },
//   cell: {
//     width: 120,
//     textAlign: 'center',
//     paddingHorizontal: 5,
//     color: '#333',
//   },
//   noResults: {
//     padding: 20,
//     alignItems: 'center',
//   },
//   noResultsText: {
//     fontSize: 16,
//     color: '#666',
//   },
//   paginationContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 10,
//   },
//   paginationButton: {
//     padding: 8,
//   },
//   disabledPaginationButton: {
//     opacity: 0.5,
//   },
//   pageNumbersContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   pageNumberButton: {
//     marginHorizontal: 3,
//     paddingVertical: 6,
//     paddingHorizontal: 10,
//     borderRadius: 5,
//     backgroundColor: '#f1f1f1',
//   },
//   currentPageButton: {
//     backgroundColor: '#00001A',
//   },
//   pageNumberText: {
//     color: '#2A47CB',
//     fontSize: 16,
//   },
//   currentPageText: {
//     color: '#fff',
//     fontWeight: 'bold',
//   },
//   ellipsisText: {
//     fontSize: 16,
//     marginHorizontal: 5,
//     color: '#333',
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   modalContainer: {
//     width: '90%',
//     backgroundColor: '#fff',
//     borderRadius: 15,
//     padding: 20,
//     maxHeight: '90%',
//     elevation: 10,
//   },
//   modalTitle: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#000000',
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   input: {
//     height: 45,
//     paddingHorizontal: 10,
//     borderWidth: 1,
//     borderColor: '#DADCE0',
//     borderRadius: 8,
//     backgroundColor: '#F7F8FA',
//     fontSize: 16,
//     color: '#000',
//     marginBottom: 10,
//   },
//   dateInput: {
//     height: 45,
//     justifyContent: 'center',
//     paddingHorizontal: 10,
//     borderWidth: 1,
//     borderColor: '#DADCE0',
//     borderRadius: 8,
//     backgroundColor: '#F7F8FA',
//     marginBottom: 10,
//   },
//   dateInputText: {
//     fontSize: 16,
//     color: '#000',
//   },
//   saveButton: {
//     backgroundColor: '#28a745',
//     paddingVertical: 12,
//     alignItems: 'center',
//     borderRadius: 8,
//     marginTop: 15,
//   },
//   saveButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   cancelButton: {
//     backgroundColor: '#A52A2A',
//     paddingVertical: 12,
//     alignItems: 'center',
//     borderRadius: 8,
//     marginTop: 10,
//     marginBottom: 20,
//   },
//   cancelButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   successIcon: {
//     marginBottom: 15,
//     alignSelf: 'center',
//   },
//   successTitle: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#28a745',
//     textAlign: 'center',
//     marginBottom: 10,
//   },
//   successMessage: {
//     fontSize: 16,
//     textAlign: 'center',
//     marginBottom: 20,
//     color: '#3C4043',
//   },
//   closeButton: {
//     width: '100%',
//     height: 50,
//     backgroundColor: '#A52A2A',
//     borderRadius: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//   },
//   closeButtonText: {
//     color: '#FFFFFF',
//     fontSize: 18,
//   },
// });

// export default QRGenerator;


import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function QRGenerator() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>This Section is under development..</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});