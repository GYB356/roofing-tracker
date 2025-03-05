import React from 'react';
import { FiPlus, FiRefreshCw, FiAlertTriangle, FiCheck } from 'react-icons/fi';

// Inline PageLayout component
const PageLayout = ({ 
  title, 
  description, 
  bgColor = "bg-blue-600", 
  textColor = "text-blue-100", 
  children,
  actions
}) => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-screen-xl">
      <div className={`${bgColor} rounded-t-lg shadow-lg overflow-hidden`}>
        <div className="px-6 py-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className={`mt-2 ${textColor}`}>{description}</p>
            </div>
            {actions && (
              <div className="ml-4">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-lg p-6">
        {children}
      </div>
    </div>
  );
};

const MedicationsPage = () => {
  const actionButtons = (
    <div className="flex space-x-2">
      <button className="bg-white text-green-600 hover:bg-green-50 font-medium px-4 py-2 rounded-lg flex items-center shadow-sm">
        <FiPlus className="mr-2" />
        Add Medication
      </button>
      <button className="bg-green-700 text-white hover:bg-green-800 font-medium px-4 py-2 rounded-lg flex items-center shadow-sm">
        <FiRefreshCw className="mr-2" />
        Refill Requests
      </button>
    </div>
  );

  // Sample medications
  const medications = [
    { 
      name: 'Lisinopril', 
      dosage: '10 mg', 
      instructions: 'Take once daily in the morning', 
      prescriber: 'Dr. Robert Chen',
      refills: 2,
      nextRefill: '2024-03-15',
      status: 'active'
    },
    { 
      name: 'Atorvastatin', 
      dosage: '20 mg', 
      instructions: 'Take once daily at bedtime', 
      prescriber: 'Dr. Robert Chen',
      refills: 1,
      nextRefill: '2024-02-28',
      status: 'active'
    },
    { 
      name: 'Amoxicillin', 
      dosage: '500 mg', 
      instructions: 'Take three times daily with food until completed', 
      prescriber: 'Dr. Sarah Johnson',
      refills: 0,
      nextRefill: null,
      status: 'completed'
    }
  ];

  return (
    <PageLayout
      title="Medications"
      description="Manage your current and past medications."
      bgColor="bg-green-600"
      textColor="text-green-100"
      actions={actionButtons}
    >
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Medications</h2>
        
        <div className="space-y-4">
          {medications.filter(med => med.status === 'active').map((medication, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between">
                <div>
                  <div className="flex items-center">
                    <h3 className="font-medium text-lg text-gray-900 dark:text-white">{medication.name}</h3>
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs rounded-full">
                      Active
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">{medication.dosage}</p>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{medication.instructions}</p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Prescribed by: {medication.prescriber}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Refills:</span> {medication.refills}
                  </p>
                  {medication.nextRefill && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      Next refill: {medication.nextRefill}
                    </p>
                  )}
                  <button className="mt-4 px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg text-sm">
                    Request Refill
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {medications.filter(med => med.status === 'active').length === 0 && (
          <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <FiCheck className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Active Medications</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You don't have any active medications at this time.
            </p>
          </div>
        )}
      </div>
      
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Medication History</h2>
        
        <div className="space-y-4">
          {medications.filter(med => med.status === 'completed').map((medication, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex justify-between">
                <div>
                  <div className="flex items-center">
                    <h3 className="font-medium text-gray-700 dark:text-gray-300">{medication.name}</h3>
                    <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs rounded-full">
                      Completed
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">{medication.dosage}</p>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{medication.instructions}</p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Prescribed by: {medication.prescriber}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {medications.filter(med => med.status === 'completed').length === 0 && (
          <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">
              No medication history available.
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-6 bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-900/30 rounded-lg p-4">
        <div className="flex items-start">
          <FiAlertTriangle className="text-yellow-500 mt-1 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-yellow-800 dark:text-yellow-300">Important Reminder</h3>
            <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-1">
              Always take medications as prescribed by your doctor. Do not adjust dosages or stop taking medications without consulting your healthcare provider.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
        <p className="text-gray-600 dark:text-gray-300">
          This page is under development. Check back soon for more medication management features.
        </p>
      </div>
    </PageLayout>
  );
};

export default MedicationsPage;