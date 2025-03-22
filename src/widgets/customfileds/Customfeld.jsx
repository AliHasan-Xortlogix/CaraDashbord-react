import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Checkbox,
  Button,
  Box,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import { Card, CardHeader, CardBody, Typography } from "@material-tailwind/react";
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { fetchCustomFields, updateDisplaySettings } from '@/Redux/slices/customfieldslice';  // Import the Redux actions
import { toast } from 'react-toastify';  // Import toast library for notifications
import 'react-toastify/dist/ReactToastify.css';
import  {getImageSettings} from '@/Redux/slices/secretIdSlice'
const CustomFieldsSelection = () => {
  const dispatch = useDispatch();
  const { customFields, loading, error } = useSelector(state => state.displaycfields);
  const { displaycf } = useSelector(state => state.clientIdsSet); // Getting selected fields from the Redux store
  const [selectedFields, setSelectedFields] = useState([]);  // Store both cf_id and cf_name
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [isSaving, setIsSaving] = useState(false);  // To manage save button state

  useEffect(() => {
    // Dispatch fetchCustomFields when the component mounts
    dispatch(fetchCustomFields());
  }, [dispatch]);

  // Handle field selection for saving based on cf_id and cf_name
  const handleSelection = (cf_id, cf_name) => {
    if (selectedFields.some(field => field.cf_id === cf_id)) {
      // Remove field if already selected
      setSelectedFields(selectedFields.filter(item => item.cf_id !== cf_id));
    } else if (selectedFields.length < 6) {
      // Add new field if less than 6 fields are selected
      setSelectedFields([...selectedFields, { cf_id, cf_name }]);
    }
  };

  // Handle save functionality
  const handleSave = () => {
    // Prepare fields to save with cf_id and cf_name
    const fieldsToSave = selectedFields.map(field => ({
      cf_id: field.cf_id,  // Store cf_id
      cf_name: field.cf_name, // Store cf_name
    }));

    setIsSaving(true);  // Disable the save button while saving

    // Dispatch save action to Redux store
    dispatch(updateDisplaySettings({ displaySetting: fieldsToSave }))
      .then(() => {
        // After saving, show a success notification
        toast.success('Selections saved successfully!');
dispatch(getImageSettings())
        // Trigger refresh or re-fetch the custom fields after saving
        dispatch(fetchCustomFields());

        // Disable the save button after saving
        setIsSaving(false);
      })
      .catch((error) => {
        // Show error notification in case of failure
        toast.error('Error saving selections!');
        setIsSaving(false);
      });
  };

  // Handle search query input
  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
    setPage(0); // Reset to the first page on search
  };

  // Filter custom fields based on search query
  const filteredFields = customFields.filter(({ cf_id, cf_key, cf_name }) =>
    (cf_id && cf_id.toLowerCase().includes(searchQuery.toLowerCase())) ||   // Filter based on cf_id
    (cf_key && cf_key.toLowerCase().includes(searchQuery.toLowerCase())) || // Filter based on cf_key
    (cf_name && cf_name.toLowerCase().includes(searchQuery.toLowerCase()))  // Filter based on cf_name
  );

  // Handle pagination change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0); // Reset to first page on rows per page change
  };

  // Ensure displaycf is always an array and contains cf_id and cf_name
  const rowData = Array.isArray(displaycf) ? displaycf.map(field => ({
    cf_id: field.cf_id,
    cf_name: field.cf_name
  })) : [];

  const columnDefs = [
    { headerName: 'Field Key (ID)', field: 'cf_id', sortable: true, filter: true, flex: 1 },
    { headerName: 'Field Value (Name)', field: 'cf_name', sortable: true, filter: true, flex: 2 }
  ];

  const paginatedFields = filteredFields.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <div className="p-6">
      <Card>
        <CardHeader variant="gradient" color="gray" className="mb-8 p-6" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className='flex items-center justify-between'>
            <Typography variant="h6" color="white" sx={{ flexGrow: 1 }}>
              Select Custom Fields
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <TextField
                label="Search Fields"
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={handleSearch}
                InputLabelProps={{ style: { color: 'white' } }}
                InputProps={{ style: { color: 'white' } }}
                sx={{ backgroundColor: 'transparent', borderRadius: 1, border: '2px solid white' }}
              />
            </Box>
          </div>
        </CardHeader>

        <CardBody>
          <Paper elevation={3}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Field (ID)</strong></TableCell>
                    <TableCell align="left"><strong>Value (Name)</strong></TableCell>
                    <TableCell align="center"><strong>Select</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedFields.map(({ cf_key, cf_name, cf_id }) => (
                    <TableRow key={cf_id} hover>
                      <TableCell>{cf_id}</TableCell>
                      <TableCell>{cf_name}</TableCell>
                      <TableCell align="center">
                        <Checkbox
                          checked={selectedFields.some(field => field.cf_id === cf_id)}
                          onChange={() => handleSelection(cf_id, cf_name)}
                          color="primary"
                          disabled={selectedFields.length === 6 && !selectedFields.some(field => field.cf_id === cf_id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredFields.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />

          <Button variant="contained" color="primary" onClick={handleSave} disabled={selectedFields.length === 0 || isSaving} className="mt-6">
            {isSaving ? 'Saving...' : 'Save Selections'}
          </Button>
        </CardBody>
      </Card>

      <div className="mt-12">
        <Card >
          <CardHeader variant="gradient" color="gray" className="mb-8 p-6" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" color="white" sx={{ flexGrow: 1 }}>Selected Fields</Typography>
          </CardHeader>
          <CardBody className="ag-theme-alpine" style={{ height: '100%', width: '100%' }}>
            <AgGridReact
              columnDefs={columnDefs}
              rowData={rowData}
              pagination={true}
              domLayout='autoHeight'
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default CustomFieldsSelection;
