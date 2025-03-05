import React from 'react';
import { FiEdit, FiMessageSquare } from 'react-icons/fi';

// Inline PageLayout component to avoid import issues
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
      {/* Header section */}
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
      
      {/* Content section */}
      <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-lg p-6">
        {children}
      </div>
    </div>
  );
};

const MessagesPage = () => {
  // Example action buttons for the header
  const actionButtons = (
    <button className="bg-white text-purple-600 hover:bg-purple-50 font-medium px-4 py-2 rounded-lg flex items-center shadow-sm">
      <FiEdit className="mr-2" />
      New Message
    </button>
  );

  return (
    <PageLayout
      title="Messages"
      description="Communicate with your healthcare providers."
      bgColor="bg-purple-600"
      textColor="text-purple-100"
      actions={actionButtons}
    >
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:space-x-4">
          {/* Left sidebar */}
          <div className="w-full md:w-1/3 mb-4 md:mb-0">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                <h3 className="font-medium text-gray-900 dark:text-white">Conversations</h3>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 min-h-[200px]">
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <FiMessageSquare className="mx-auto h-10 w-10 mb-2 opacity-50" />
                  <p>No messages yet</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main content area */}
          <div className="w-full md:w-2/3">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                <h3 className="font-medium text-gray-900 dark:text-white">Message Content</h3>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 min-h-[200px]">
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <p>Select a conversation or start a new message</p>
                  
                  <button className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg">
                    <FiEdit className="inline mr-2" />
                    Compose New Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            This page is under development. Check back soon for messaging features.
          </p>
        </div>
      </div>
    </PageLayout>
  );
};

export default MessagesPage;