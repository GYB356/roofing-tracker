import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiCheckCircle, FiAlertTriangle, FiLock } from 'react-icons/fi';

const HipaaConsent = () => {
  const { acceptHipaaConsent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  
  const from = location.state?.from?.pathname || '/';
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!consentChecked) {
      setError('You must accept the HIPAA consent to continue.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      await acceptHipaaConsent();
      
      // Redirect to the page they were trying to access
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to submit HIPAA consent. Please try again.');
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <div className="text-center">
          <FiLock className="mx-auto h-12 w-12 text-primary-600 dark:text-primary-400" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            HIPAA Privacy Consent
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Please review and accept our HIPAA Privacy Practices before continuing
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-500 p-4">
            <div className="flex items-center">
              <FiAlertTriangle className="text-red-500 mr-3" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}
        
        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-md overflow-y-auto max-h-96">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Notice of Privacy Practices
          </h3>
          
          <div className="prose dark:prose-invert max-w-none text-sm">
            <p>
              THIS NOTICE DESCRIBES HOW MEDICAL INFORMATION ABOUT YOU MAY BE USED AND DISCLOSED AND HOW YOU CAN GET ACCESS TO THIS INFORMATION. PLEASE REVIEW IT CAREFULLY.
            </p>
            
            <h4>Understanding Your Health Record/Information</h4>
            <p>
              Each time you visit a hospital, physician, or other healthcare provider, a record of your visit is made. Typically, this record contains your symptoms, examination and test results, diagnoses, treatment, and a plan for future care or treatment. This information, often referred to as your health or medical record, serves as a:
            </p>
            <ul>
              <li>Basis for planning your care and treatment</li>
              <li>Means of communication among the many health professionals who contribute to your care</li>
              <li>Legal document describing the care you received</li>
              <li>Means by which you or a third-party payer can verify that services billed were actually provided</li>
              <li>Tool in educating health professionals</li>
              <li>Source of data for medical research</li>
              <li>Source of information for public health officials charged with improving the health of the nation</li>
              <li>Source of data for facility planning and marketing</li>
              <li>Tool with which we can assess and continually work to improve the care we render and the outcomes we achieve</li>
            </ul>
            
            <h4>Your Health Information Rights</h4>
            <p>
              Although your health record is the physical property of the healthcare practitioner or facility that compiled it, the information belongs to you. You have the right to:
            </p>
            <ul>
              <li>Request a restriction on certain uses and disclosures of your information</li>
              <li>Obtain a paper copy of the notice of privacy practices upon request</li>
              <li>Inspect and obtain a copy of your health record</li>
              <li>Amend your health record</li>
              <li>Obtain an accounting of disclosures of your health information</li>
              <li>Request communications of your health information by alternative means or at alternative locations</li>
              <li>Revoke your authorization to use or disclose health information except to the extent that action has already been taken</li>
            </ul>
            
            <h4>Our Responsibilities</h4>
            <p>
              HealthcareSync is required to:
            </p>
            <ul>
              <li>Maintain the privacy of your health information</li>
              <li>Provide you with a notice as to our legal duties and privacy practices with respect to information we collect and maintain about you</li>
              <li>Abide by the terms of this notice</li>
              <li>Notify you if we are unable to agree to a requested restriction</li>
              <li>Accommodate reasonable requests you may have to communicate health information by alternative means or at alternative locations</li>
            </ul>
            
            <p>
              We reserve the right to change our practices and to make the new provisions effective for all protected health information we maintain. Should our information practices change, we will post the revised notice in our facility and on our website.
            </p>
            
            <p>
              We will not use or disclose your health information without your authorization, except as described in this notice.
            </p>
            
            <h4>For More Information or to Report a Problem</h4>
            <p>
              If you have questions and would like additional information, you may contact the HealthcareSync Privacy Officer at 1-800-555-1234.
            </p>
            
            <p>
              If you believe your privacy rights have been violated, you can file a complaint with the HealthcareSync Privacy Officer or with the Secretary of Health and Human Services. There will be no retaliation for filing a complaint.
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="consent"
                name="consent"
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="consent" className="font-medium text-gray-700 dark:text-gray-300">
                I have read and understand the HIPAA Privacy Notice and consent to the use and disclosure of my health information as described.
              </label>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading || !consentChecked}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading || !consentChecked
                  ? 'bg-primary-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
              }`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center">
                  <FiCheckCircle className="mr-2" />
                  Accept & Continue
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HipaaConsent;