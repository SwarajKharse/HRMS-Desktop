import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiClock, FiAlertCircle, FiCheck, FiFilePlus, FiTrash2 } from "react-icons/fi"
import { leadService } from "../services/leadService";
import { data } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"

function AddLead() {

  const [rows, setRows] = useState([]);
  const [middleManrows, setMiddleManRows] = useState([]);
  const [architectfirm, seArchitectFirm] = useState([]);
  const [mepFirm, setMepFirm] = useState([]);
  const [pmcFirm, setPmcFirm] = useState([]);
  const { user } = useAuth()

  let userId = '';
  if (user) {
    userId = user.userId;
  }

  const [leadData, setLeadData] = useState({
    date_recieved: new Date().toISOString().split("T")[0],
    lead_source: '',
    lead_priority: '',
    lead_type: '',
    product_type: '',
    //additionalDetails: [],
    //middleManDetails: [],
    employee: {
      id: userId
    },
    client_name: '',
    project_location: '',
    office_location: '',
    middle_man_client_name: '',
    middle_man_office_location: '',
    middle_man_project_location: '',
    architect_client_name: '',
    architect_office_location: '',
    architect_project_location: '',
    mep_client_name: '',
    mep_office_location: '',
    mep_project_location: '',
    pmc_client_name: '',
    pmc_office_location: '',
    pmc_project_location: ''  
  });



  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [isValid, setIsValid] = useState(false)
  const [sourcelist, setSourcelist] = useState([]);
  const [typelist, setTypelist] = useState([]);
  const [producttypelist, setProductTypelist] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  //const { user } = useAuth()


  useEffect(() => {
    // If there is data, the form is valid
    fetchSourceTypeData()
    setIsValid(data ? true : false);
  }, [data]);


  const fetchSourceTypeData = async () => {
    try {
      const [leadSource, leadType, leadProductType] = await Promise.all([
        leadService.getLeadSourceList(),
        leadService.getLeadTypeList(),
        leadService.getLeadProductTypeList()
      ]);
      setSourcelist(leadSource);
      setTypelist(leadType);
      setProductTypelist(leadProductType);

    } catch (err) {
      setError("Error while fetching data")
      console.error(err)
    } finally {
      setDataLoading(false)
    }
  }

  const addRow = (event) => {
    /* console.log(rows);
    console.log(rows.length); */
    event.preventDefault();
    var length = rows.length;
    setRows([...rows, { id: length, contact_person_name: '', contact_person_phonenumber: '', contact_person_email: '', contact_person_designation: '' }]);
  };

  const addMiddleManRow = (event) => {
    event.preventDefault();
    var length = middleManrows.length;
    setMiddleManRows([...middleManrows, { id: length, mcontact_person_name: '', mcontact_person_phonenumber: '', mcontact_person_email: '', mcontact_person_designation: '' }]);
  };

  const addArchitectRow = (event) => {
    event.preventDefault();
    var length = architectfirm.length;
    seArchitectFirm([...architectfirm, { id: length, arcontact_person_name: '', arcontact_person_phonenumber: '', arcontact_person_email: '', arcontact_person_designation: '' }]);
  };


  const addMEPRow = (event) => {
    event.preventDefault();
    var length = mepFirm.length;
    setMepFirm([...mepFirm, { id: length, mepcontact_person_name: '', mepcontact_person_phonenumber: '', mepcontact_person_email: '', mepcontact_person_designation: '' }]);
  };

  const addPMCRow = (event) => {
    event.preventDefault();
    var length = pmcFirm.length;
    setPmcFirm([...pmcFirm, { id: length, pmccontact_person_name: '', pmccontact_person_phonenumber: '', pmccontact_person_email: '', pmccontact_person_designation: '' }]);
  };

  const handleSelectChange = (event) => {
    let name = event.target.name;
    let value = event.target.value;

    //console.log(name + "  --  " + value);

    if (name === "date_recieved") setLeadData({ ...leadData, date_recieved: value, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, product_type: leadData.product_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "lead_source") setLeadData({ ...leadData, lead_source: value, date_recieved: leadData.date_recieved, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, product_type: leadData.product_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "lead_priority") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, lead_priority: value, lead_source: leadData.lead_source, lead_type: leadData.lead_type, product_type: leadData.product_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "lead_type") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, lead_type: value, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, product_type: leadData.product_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "product_type") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: value, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "client_name") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: value, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "project_location") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: value, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "office_location") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: value, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "middle_man_client_name") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: value, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "middle_man_office_location") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: value, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "middle_man_project_location") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: value, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "architect_client_name") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: value, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "architect_project_location") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: value, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "architect_office_location") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: value, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "mep_client_name") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: value, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "mep_project_location") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: value, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "mep_office_location") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: value, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });


  
    if (name === "pmc_client_name") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: value, pmc_project_location: leadData.pmc_project_location, pmc_office_location: leadData.pmc_office_location });

    if (name === "pmc_project_location") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: value, pmc_office_location: leadData.pmc_office_location });

    if (name === "pmc_office_location") setLeadData({ ...leadData, date_recieved: leadData.date_recieved, product_type: leadData.product_type, lead_source: leadData.lead_source, lead_priority: leadData.lead_priority, lead_type: leadData.lead_type, client_name: leadData.client_name, project_location: leadData.project_location, office_location: leadData.office_location, middle_man_client_name: leadData.middle_man_client_name, middle_man_office_location: leadData.middle_man_office_location, middle_man_project_location: leadData.middle_man_project_location, architect_client_name: leadData.architect_client_name, architect_project_location: leadData.architect_project_location, architect_office_location: leadData.architect_office_location, mep_client_name: leadData.mep_client_name, mep_project_location: leadData.mep_project_location, mep_office_location: leadData.mep_office_location, pmc_client_name: leadData.pmc_client_name, pmc_project_location: leadData.pmc_project_location, pmc_office_location: value });

    //console.log(leadData);
  };


  const removeRow = (id, e) => {
    e.preventDefault();
    setRows(rows.filter((row) => row.id !== id));
  };

  const removeMiddleManRow = (id, e) => {
    e.preventDefault();
    setMiddleManRows(middleManrows.filter((row) => row.id !== id));
  };

  const removeArchitectRow = (id, e) => {
    e.preventDefault();
    seArchitectFirm(architectfirm.filter((row) => row.id !== id));
  };

  const removeMEPRow = (id, e) => {
    e.preventDefault();
    setMepFirm(mepFirm.filter((row) => row.id !== id));
  };

  const removePMCRow = (id, e) => {
    e.preventDefault();
    setPmcFirm(pmcFirm.filter((row) => row.id !== id));
  };


  const handleChange = (id, event) => {

    let name = event.target.name;
    let value = event.target.value;


    const updatedRows = rows.map((row) => {
      if (row.id === id) {


        if (name === "contact_person_name") return { ...row, client_name: row.client_name, office_location: row.office_location, project_location: row.project_location, contact_person_name: value, contact_person_phonenumber: row.contact_person_phonenumber, contact_person_email: row.contact_person_email, contact_person_designation: row.contact_person_designation };

        if (name === "contact_person_phonenumber") return { ...row, client_name: row.client_name, office_location: row.office_location, project_location: row.project_location, contact_person_name: row.contact_person_name, contact_person_phonenumber: value, contact_person_email: row.contact_person_email, contact_person_designation: row.contact_person_designation };

        if (name === "contact_person_email") return { ...row, client_name: row.client_name, office_location: row.office_location, project_location: row.project_location, contact_person_name: row.contact_person_name, contact_person_phonenumber: row.contact_person_phonenumber, contact_person_email: value, contact_person_designation: row.contact_person_designation };

        if (name === "contact_person_designation") return { ...row, client_name: row.client_name, office_location: row.office_location, project_location: row.project_location, contact_person_name: row.contact_person_name, contact_person_phonenumber: row.contact_person_phonenumber, contact_person_email: row.contact_person_email, contact_person_designation: value };

      } else {
        return row
      }
      //? { ...row, client_name: event.target.client_name, office_location:event.target.office_location, project_location: event.target.project_location, contact_person_name:event.target.contact_person_name, contact_person_phonenumber: event.target.contact_person_phonenumber, contact_person_email: event.target.contact_person_email } : row
    });
    setRows(updatedRows);
  };


  const handleMiddleManChange = (id, event) => {
    console.log(id);
    console.log(event.target);
    let name = event.target.name;
    let value = event.target.value;


    const updatedRows = middleManrows.map((row) => {
      if (row.id === id) {

        if (name === "mcontact_person_name") return { ...row, mclient_name: row.mclient_name, moffice_location: row.moffice_location, mproject_location: row.mproject_location, mcontact_person_name: value, mcontact_person_phonenumber: row.mcontact_person_phonenumber, mcontact_person_email: row.mcontact_person_email, mcontact_person_designation: row.mcontact_person_designation };

        if (name === "mcontact_person_phonenumber") return { ...row, mclient_name: row.mclient_name, moffice_location: row.moffice_location, mproject_location: row.mproject_location, mcontact_person_name: row.mcontact_person_name, mcontact_person_phonenumber: value, mcontact_person_email: row.mcontact_person_email, mcontact_person_designation: row.mcontact_person_designation };

        if (name === "mcontact_person_email") return { ...row, mclient_name: row.mclient_name, moffice_location: row.moffice_location, mproject_location: row.mproject_location, mcontact_person_name: row.mcontact_person_name, mcontact_person_phonenumber: row.mcontact_person_phonenumber, mcontact_person_email: value, mcontact_person_designation: row.mcontact_person_designation };

        if (name === "mcontact_person_designation") return { ...row, mclient_name: row.mclient_name, moffice_location: row.moffice_location, mproject_location: row.mproject_location, mcontact_person_name: row.mcontact_person_name, mcontact_person_phonenumber: row.mcontact_person_phonenumber, mcontact_person_email: row.mcontact_person_email, mcontact_person_designation: value };

      } else {
        return row
      }
      //? { ...row, client_name: event.target.client_name, office_location:event.target.office_location, project_location: event.target.project_location, contact_person_name:event.target.contact_person_name, contact_person_phonenumber: event.target.contact_person_phonenumber, contact_person_email: event.target.contact_person_email } : row
    });
    setMiddleManRows(updatedRows);
  };

  const handleArchitectChange = (id, event) => {
    console.log(id);
    console.log(event.target);
    let name = event.target.name;
    let value = event.target.value;


    const updatedRows = architectfirm.map((row) => {
      if (row.id === id) {

        if (name === "arcontact_person_name") return { ...row, mclient_name: row.mclient_name, moffice_location: row.moffice_location, mproject_location: row.mproject_location, arcontact_person_name: value, arcontact_person_phonenumber: row.arcontact_person_phonenumber, arcontact_person_email: row.arcontact_person_email, arcontact_person_designation: row.arcontact_person_designation };

        if (name === "arcontact_person_phonenumber") return { ...row, mclient_name: row.mclient_name, moffice_location: row.moffice_location, mproject_location: row.mproject_location, arcontact_person_name: row.arcontact_person_name, arcontact_person_phonenumber: value, arcontact_person_email: row.arcontact_person_email, arcontact_person_designation: row.arcontact_person_designation };

        if (name === "arcontact_person_email") return { ...row, mclient_name: row.mclient_name, moffice_location: row.moffice_location, mproject_location: row.mproject_location, arcontact_person_name: row.arcontact_person_name, arcontact_person_phonenumber: row.arcontact_person_phonenumber, arcontact_person_email: value, arcontact_person_designation: row.arcontact_person_designation };

        if (name === "arcontact_person_designation") return { ...row, mclient_name: row.mclient_name, moffice_location: row.moffice_location, mproject_location: row.mproject_location, arcontact_person_name: row.arcontact_person_name, arcontact_person_phonenumber: row.arcontact_person_phonenumber, arcontact_person_email: row.arcontact_person_email, arcontact_person_designation: value };

      } else {
        return row
      }
      //? { ...row, client_name: event.target.client_name, office_location:event.target.office_location, project_location: event.target.project_location, contact_person_name:event.target.contact_person_name, contact_person_phonenumber: event.target.contact_person_phonenumber, contact_person_email: event.target.contact_person_email } : row
    });
    seArchitectFirm(updatedRows);
  };


  const handleMEPChange = (id, event) => {
    console.log(id);
    console.log(event.target);
    let name = event.target.name;
    let value = event.target.value;


    const updatedRows = mepFirm.map((row) => {
      if (row.id === id) {

        if (name === "mepcontact_person_name") return { ...row, mepcontact_person_name: value, mepcontact_person_phonenumber: row.mepcontact_person_phonenumber, mepcontact_person_email: row.mepcontact_person_email, mepcontact_person_designation: row.mepcontact_person_designation };

        if (name === "mepcontact_person_phonenumber") return { ...row, mepcontact_person_name: row.mepcontact_person_name, mepcontact_person_phonenumber: value, mepcontact_person_email: row.mepcontact_person_email, mepcontact_person_designation: row.mepcontact_person_designation };

        if (name === "mepcontact_person_email") return { ...row, mepcontact_person_name: row.mepcontact_person_name, mepcontact_person_phonenumber: row.mepcontact_person_phonenumber, mepcontact_person_email: value, mepcontact_person_designation: row.mepcontact_person_designation };

        if (name === "mepcontact_person_designation") return { ...row, mepcontact_person_name: row.mepcontact_person_name, mepcontact_person_phonenumber: row.mepcontact_person_phonenumber, mepcontact_person_email: row.mepcontact_person_email, mepcontact_person_designation: value };

      } else {
        return row
      }
      //? { ...row, client_name: event.target.client_name, office_location:event.target.office_location, project_location: event.target.project_location, contact_person_name:event.target.contact_person_name, contact_person_phonenumber: event.target.contact_person_phonenumber, contact_person_email: event.target.contact_person_email } : row
    });
    setMepFirm(updatedRows);
  };


  const handlePMCChange = (id, event) => {
    console.log(id);
    console.log(event.target);
    let name = event.target.name;
    let value = event.target.value;


    const updatedRows = pmcFirm.map((row) => {
      if (row.id === id) {

        if (name === "pmccontact_person_name") return { ...row, pmccontact_person_name: value, pmccontact_person_phonenumber: row.pmccontact_person_phonenumber, pmccontact_person_email: row.pmccontact_person_email, pmccontact_person_designation: row.pmccontact_person_designation };

        if (name === "pmccontact_person_phonenumber") return { ...row, pmccontact_person_name: row.pmccontact_person_name, pmccontact_person_phonenumber: value, pmccontact_person_email: row.pmccontact_person_email, pmccontact_person_designation: row.pmccontact_person_designation };

        if (name === "pmccontact_person_email") return { ...row, pmccontact_person_name: row.pmccontact_person_name, pmccontact_person_phonenumber: row.pmccontact_person_phonenumber, pmccontact_person_email: value, pmccontact_person_designation: row.pmccontact_person_designation };

        if (name === "pmccontact_person_designation") return { ...row, pmccontact_person_name: row.pmccontact_person_name, pmccontact_person_phonenumber: row.pmccontact_person_phonenumber, pmccontact_person_email: row.pmccontact_person_email, pmccontact_person_designation: value };

      } else {
        return row
      }
      //? { ...row, client_name: event.target.client_name, office_location:event.target.office_location, project_location: event.target.project_location, contact_person_name:event.target.contact_person_name, contact_person_phonenumber: event.target.contact_person_phonenumber, contact_person_email: event.target.contact_person_email } : row
    });
    setPmcFirm(updatedRows);
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    setError(null)

    try {

      let allCorrect = true;
      if (leadData.date_recieved == undefined || leadData.date_recieved == "") {
        setError(true);
        throw new Error('Please select Date Recieved')
      }

      if (leadData.lead_source == undefined || leadData.lead_source == "") {
        setError(true);
        throw new Error('Please select Lead Source')
      }

      if (leadData.lead_priority == undefined || leadData.lead_priority == "") {
        setError(true);
        throw new Error('Please select Lead Priority')
      }

      if (leadData.lead_type == undefined || leadData.lead_type == "") {
        setError(true);
        throw new Error('Please select Lead Type')
      }

      if (leadData.product_type == undefined || leadData.product_type == "") {
        setError(true);
        throw new Error('Please select Product Type')
      }

    
      var newRows = rows.map((row, i) => {
        return {
          ...row,
          id: null
        }
      })

      var newMiddleManrows = middleManrows.map((row, i) => {
        return {
          ...row,
          id: null
        }
      })

      var newArchitectFirm = architectfirm.map((row, i) => {
        return {
          ...row,
          id: null
        }
      })

      var newMEPFirm = mepFirm.map((row, i) => {
        return {
          ...row,
          id: null
        }
      })

      var newpmcFirm = pmcFirm.map((row, i) => {
        return {
          ...row,
          id: null
        }
      })

      const submitData = {
        ...leadData,
        lead_recieved: new Date(leadData.date_recieved).toISOString(),
        additionalDetails: newRows,
        middleManDetails: newMiddleManrows,
        architectFirmDetails: newArchitectFirm,
        mepFirmDetails: newMEPFirm,
        pmcFirmDetails: newpmcFirm
      };

      console.log(submitData);
      await leadService.createLead(submitData);
      //console.log("lead data from server" + newLeadData);

      window.scrollTo(0,0);
      setSuccess(true)
      setTimeout(function () {
        setSuccess(false);
        window.location.reload(1);
      }, 3000);
      /* setTimeout(() =>
        ,
        window.location.reload(1)
        , 9000) */
      //window.location.reload();
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Simple table header and cell components
  const TableHeader = ({ children }) => (
    <th className="px-2 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b flex-wrap">
      {children}
    </th>
  );


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 min-w-full">

      <div className="flex items-center space-x-2 mb-6">
        <FiFilePlus className="text-blue-600 w-6 h-6" />
        <h1 className="text-2xl font-bold">Add New Lead</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md flex items-center">
          <FiAlertCircle className="mr-2" />
          {error}
        </div>
      )}

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-50 text-green-500 p-4 rounded-md flex items-center"
          >
            <FiCheck className="mr-2" />
            Lead saved successfully!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border">
          {/* Lead Details Start */}
          <div class="space-y-4 bg-white p-4 border border-b-indigo-500">
            <h3 class="font-semibold text-lg border-b pb-2">Lead Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Recieved <span class="text-red-500">*</span></label>
                <input
                  type="date"
                  name="date_recieved"
                  value={leadData.date_recieved}
                  onChange={handleSelectChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Source <span class="text-red-500">*</span></label>
                <select
                  name="lead_source"
                  value={leadData.lead_source}
                  onChange={handleSelectChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">

                  <option value="">Select Type</option>
                  {sourcelist.map((country, i) => {
                    return <option key={i} value={country.id}>{country.label}</option>
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lead Priority <span class="text-red-500">*</span></label>
                <select
                  value={leadData.lead_priority}
                  onChange={handleSelectChange}
                  name="lead_priority" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
                  <option value="">Select Type</option>
                  <option value="cold">Cold</option>
                  <option value="hot">Hot</option>
                  <option value="warm">Warm</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lead Type <span class="text-red-500">*</span></label>
                <select
                  name="lead_type"
                  value={leadData.lead_type}
                  onChange={handleSelectChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
                  <option value="">Select Type</option>
                  {typelist.map((country, i) => {
                    return <option key={i} value={country.id}>{country.label}</option>
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Type <span class="text-red-500">*</span></label>
                <select
                  name="product_type"
                  value={leadData.product_type}
                  onChange={handleSelectChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
                  <option value="">Select Type</option>
                  {producttypelist.map((country, i) => {
                    return <option key={i} value={country.id}>{country.label}</option>
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Lead Details End */}

          {/* End CLient Details Start */}
          <div class="space-y-4 bg-white border border border-t-indigo-500 border-b-indigo-500 p-4">
            <h3 class="font-semibold text-lg border-b pb-2">End Client Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <table>
                <thead>
                  <tr>
                    {/* <TableHeader> # </TableHeader> */}
                    <TableHeader>Client Name <span class="text-red-500">*</span></TableHeader>
                    <TableHeader>Project Location <span class="text-red-500">*</span></TableHeader>
                    <TableHeader>Office Location <span class="text-red-500">*</span></TableHeader>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <textarea name="client_name"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.client_name}
                        onChange={handleSelectChange}>
                      </textarea>
                    </td>
                    <td>
                      <textarea
                        name="project_location"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.project_location}
                        onChange={handleSelectChange}
                      ></textarea>
                    </td>
                    <td>
                      <textarea name="office_location"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.office_location}
                        onChange={handleSelectChange}></textarea>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    {/* <TableHeader> # </TableHeader> */}
                    <TableHeader>Contact Person Name</TableHeader>
                    <TableHeader>Contact Person Phone</TableHeader>
                    <TableHeader>Contact Person Email</TableHeader>
                    <TableHeader>Contact Person Designation</TableHeader>
                    <TableHeader>Action </TableHeader>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rows.map((row, idx) => (
                    <tr key={idx} class="hover:bg-gray-50">
                      {/* <td>{idx}</td> */}

                      <td className="px-2 py-2">
                        <input type="text" name="contact_person_name"
                          value={row.contact_person_name}
                          onChange={(event) => handleChange(idx, event,)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>
                        <input type="tel" name="contact_person_phonenumber" value={row.contact_person_phonenumber}
                          onChange={(event) => handleChange(idx, event,)}
                          pattern="[789][0-9]{9}"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>

                        <input type="email" name="contact_person_email"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                          value={row.contact_person_email}
                          onChange={(event) => handleChange(idx, event,)} />
                      </td>
                      <td class="px-2 py-2 whitespace-nowrap">
                        <input type="text"
                          name="contact_person_designation"
                          value={row.contact_person_designation}
                          onChange={(event) => handleChange(idx, event,)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        />
                      </td>
                      <td>
                        <button onClick={(event) => removeRow(idx, event)} className="text-red-600 hover:text-red-900">
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-start">
                <button onClick={(event) => addRow(event)} className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-gray-600">Add</button>
              </div>
            </div>
          </div>

          {/* End client Details End */}


          {/* Middle Man Details Start */}
          <div class="space-y-4 bg-white border border border-t-indigo-500 border-b-indigo-500 p-4">
            <h3 class="font-semibold text-lg border-b pb-2">Middle Man Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <table>
                <thead>
                  <tr>
                    {/* <TableHeader> # </TableHeader> */}
                    <TableHeader>Client Name <span class="text-red-500">*</span></TableHeader>
                    <TableHeader>Project Location <span class="text-red-500">*</span></TableHeader>
                    <TableHeader>Office Location <span class="text-red-500">*</span></TableHeader>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <textarea
                        name="middle_man_client_name"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.middle_man_client_name}
                        onChange={handleSelectChange}
                      ></textarea>
                    </td>
                    <td>
                      <textarea name="middle_man_office_location"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.middle_man_office_location}
                        onChange={handleSelectChange}></textarea>
                    </td>
                    <td>
                      <textarea name="middle_man_project_location"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.middle_man_project_location}
                        onChange={handleSelectChange}></textarea>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    {/* <TableHeader> # </TableHeader> */}
                    <TableHeader>Contact Person Name</TableHeader>
                    <TableHeader>Contact Person Phone no</TableHeader>
                    <TableHeader>Contact Person Email</TableHeader>
                    <TableHeader>Contact Person Designation</TableHeader>
                    <TableHeader>Action </TableHeader>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {middleManrows.map((mrow, midx) => (
                    <tr key={midx} class="hover:bg-gray-50">
                      {/* <td>{idx}</td> */}
                      <td className="px-2 py-2">
                        <input type="text"
                          name="mcontact_person_name"
                          value={mrow.mcontact_person_name}
                          onChange={(event) => handleMiddleManChange(midx, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>
                        <input type="tel"
                          pattern="[789][0-9]{9}"
                          name="mcontact_person_phonenumber"
                          value={mrow.mcontact_person_phonenumber}
                          onChange={(event) => handleMiddleManChange(midx, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>
                        <input type="email" name="mcontact_person_email"
                          value={mrow.mcontact_person_email}
                          onChange={(event) => handleMiddleManChange(midx, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td class="px-2 py-2 whitespace-nowrap">
                        <input type="text" name="mcontact_person_designation"
                          value={mrow.mcontact_person_designation}
                          onChange={(event) => handleMiddleManChange(midx, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>
                        <button onClick={(event) => removeMiddleManRow(midx, event)} className="text-red-600 hover:text-red-900">
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-start">
                <button onClick={(event) => addMiddleManRow(event)} className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-gray-600">Add</button>
              </div>
            </div>
          </div>
          {/* END of Middle Man Details */}

          {/* Architect Firm Details Start */}
          <div class="space-y-4 rounded-lg bg-white border p-4">
            <h3 class="font-semibold text-lg border-b pb-2">Architect Firm Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <table>
                <thead>
                  <tr>
                    {/* <TableHeader> # </TableHeader> */}
                    <TableHeader>Client Name <span class="text-red-500">*</span></TableHeader>
                    <TableHeader>Project Location <span class="text-red-500">*</span></TableHeader>
                    <TableHeader>Office Location <span class="text-red-500">*</span></TableHeader>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <textarea
                        name="architect_client_name"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.architect_client_name}
                        onChange={handleSelectChange}
                      ></textarea>
                    </td>
                    <td>
                      <textarea name="architect_office_location"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.architect_office_location}
                        onChange={handleSelectChange}></textarea>
                    </td>
                    <td>
                      <textarea name="architect_project_location"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.architect_project_location}
                        onChange={handleSelectChange}></textarea>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    {/* <TableHeader> # </TableHeader> */}
                    <TableHeader>Contact Person Name</TableHeader>
                    <TableHeader>Contact Person Phone no</TableHeader>
                    <TableHeader>Contact Person Email</TableHeader>
                    <TableHeader>Contact Person Designation</TableHeader>
                    <TableHeader>Action </TableHeader>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {architectfirm.map((mrow, midx) => (
                    <tr key={midx} class="hover:bg-gray-50">
                      {/* <td>{idx}</td> */}
                      <td className="px-2 py-2">
                        <input type="text"
                          name="arcontact_person_name"
                          value={mrow.arcontact_person_name}
                          onChange={(event) => handleArchitectChange(midx, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>
                        <input type="tel"
                          pattern="[789][0-9]{9}"
                          name="arcontact_person_phonenumber"
                          value={mrow.arcontact_person_phonenumber}
                          onChange={(event) => handleArchitectChange(midx, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>
                        <input type="email" name="arcontact_person_email"
                          value={mrow.arcontact_person_email}
                          onChange={(event) => handleArchitectChange(midx, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td class="px-2 py-2 whitespace-nowrap">
                        <input type="text" name="arcontact_person_designation"
                          value={mrow.arcontact_person_designation}
                          onChange={(event) => handleArchitectChange(midx, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>
                        <button onClick={(event) => removeArchitectRow(midx, event)} className="text-red-600 hover:text-red-900">
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-start">
                <button onClick={(event) => addArchitectRow(event)} className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-gray-600">Add</button>
              </div>
            </div>
          </div>
          {/* End of Architect Firm   */}

          {/* Consultant / MEP Firm */}
          <div class="space-y-4 bg-white border border border-t-indigo-500 border-b-indigo-500 p-4">
            <h3 class="font-semibold text-lg border-b pb-2">Consultant / MEP Firm Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <table>
                <thead>
                  <tr>
                    {/* <TableHeader> # </TableHeader> */}
                    <TableHeader>Client Name <span class="text-red-500">*</span></TableHeader>
                    <TableHeader>Project Location <span class="text-red-500">*</span></TableHeader>
                    <TableHeader>Office Location <span class="text-red-500">*</span></TableHeader>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <textarea
                        name="mep_client_name"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.mep_client_name}
                        onChange={handleSelectChange}
                      ></textarea>
                    </td>
                    <td>
                      <textarea name="mep_office_location"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.mep_office_location}
                        onChange={handleSelectChange}></textarea>
                    </td>
                    <td>
                      <textarea name="mep_project_location"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.mep_project_location}
                        onChange={handleSelectChange}></textarea>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    {/* <TableHeader> # </TableHeader> */}
                    <TableHeader>Contact Person Name</TableHeader>
                    <TableHeader>Contact Person Phone no</TableHeader>
                    <TableHeader>Contact Person Email</TableHeader>
                    <TableHeader>Contact Person Designation</TableHeader>
                    <TableHeader>Action </TableHeader>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mepFirm.map((mrow, midx) => (
                    <tr key={midx} class="hover:bg-gray-50">
                      {/* <td>{idx}</td> */}
                      <td className="px-2 py-2">
                        <input type="text"
                          name="mepcontact_person_name"
                          value={mrow.mepcontact_person_name}
                          onChange={(event) => handleMEPChange(midx, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>
                        <input type="tel"
                          pattern="[789][0-9]{9}"
                          name="mepcontact_person_phonenumber"
                          value={mrow.mepcontact_person_phonenumber}
                          onChange={(event) => handleMEPChange(midx, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>
                        <input type="email" name="mepcontact_person_email"
                          value={mrow.mepcontact_person_email}
                          onChange={(event) => handleMEPChange(midx, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td class="px-2 py-2 whitespace-nowrap">
                        <input type="text" name="mepcontact_person_designation"
                          value={mrow.mepcontact_person_designation}
                          onChange={(event) => handleMEPChange(midx, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>
                        <button onClick={(event) => removeMEPRow(midx, event)} className="text-red-600 hover:text-red-900">
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-start">
                <button onClick={(event) => addMEPRow(event)} className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-gray-600">Add</button>
              </div>
            </div>
          </div>
          {/* End of MEP Firm */}


          {/* PMC Firm Details */}
          <div class="space-y-4 bg-white border border border-t-indigo-500 p-4">
            <h3 class="font-semibold text-lg border-b pb-2">PMC Firm Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <table>
                <thead>
                  <tr>
                    {/* <TableHeader> # </TableHeader> */}
                    <TableHeader>Client Name <span class="text-red-500">*</span></TableHeader>
                    <TableHeader>Project Location <span class="text-red-500">*</span></TableHeader>
                    <TableHeader>Office Location <span class="text-red-500">*</span></TableHeader>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <textarea
                        name="pmc_client_name"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.pmc_client_name}
                        onChange={handleSelectChange}
                      ></textarea>
                    </td>
                    <td>
                      <textarea name="pmc_office_location"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.pmc_office_location}
                        onChange={handleSelectChange}></textarea>
                    </td>
                    <td>
                      <textarea name="pmc_project_location"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300"
                        value={leadData.pmc_project_location}
                        onChange={handleSelectChange}></textarea>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    {/* <TableHeader> # </TableHeader> */}
                    <TableHeader>Contact Person Name</TableHeader>
                    <TableHeader>Contact Person Phone no</TableHeader>
                    <TableHeader>Contact Person Email</TableHeader>
                    <TableHeader>Contact Person Designation</TableHeader>
                    <TableHeader>Action </TableHeader>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pmcFirm.map((mrow, midx) => (
                    <tr key={midx} class="hover:bg-gray-50">
                      {/* <td>{idx}</td> */}
                      <td className="px-2 py-2">
                        <input type="text"
                          name="pmccontact_person_name"
                          value={mrow.pmccontact_person_name}
                          onChange={(event) => handlePMCChange(midx, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>
                        <input type="tel"
                          pattern="[789][0-9]{9}"
                          name="pmccontact_person_phonenumber"
                          value={mrow.pmccontact_person_phonenumber}
                          onChange={(event) => handlePMCChange(midx, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>
                        <input type="email" name="pmccontact_person_email"
                          value={mrow.pmccontact_person_email}
                          onChange={(event) => handlePMCChange(midx, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td class="px-2 py-2 whitespace-nowrap">
                        <input type="text" name="pmccontact_person_designation"
                          value={mrow.pmccontact_person_designation}
                          onChange={(event) => handlePMCChange(midx, event)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                      </td>
                      <td>
                        <button onClick={(event) => removePMCRow(midx, event)} className="text-red-600 hover:text-red-900">
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-start">
                <button onClick={(event) => addPMCRow(event)} className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-gray-600">Add</button>
              </div>
            </div>
          </div>
          {/* END of PMC FIrm Detais */}

          <div className="flex justify-center py-4 px-4">
            <button
              type="submit"
              disabled={saving}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center ${saving ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                "Save Lead"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddLead;