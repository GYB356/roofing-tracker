import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Patient = sequelize.define('Patient', {
    patientId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: false
    },
    medicalHistory: {
      type: DataTypes.TEXT,
      defaultValue: ''
    },
    allergies: {
      type: DataTypes.TEXT,
      defaultValue: ''
    },
    medications: {
      type: DataTypes.TEXT,
      defaultValue: ''
    },
    lastExamDate: DataTypes.DATE,
    bloodType: DataTypes.STRING,
    primaryCareProvider: DataTypes.STRING
  }, {
    indexes: [
      {
        fields: ['firstName', 'lastName']
      },
      {
        fields: ['patientId']
      }
    ],
    paranoid: true,
    timestamps: true
  });

  Patient.associate = (models) => {
    Patient.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    Patient.hasMany(models.Appointment);
    Patient.hasMany(models.MedicalRecord);
  };

  return Patient;
};