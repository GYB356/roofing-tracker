import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Appointment = sequelize.define('Appointment', {
    appointmentId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    patientId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    clinicianId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    dateTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('checkup', 'consultation', 'procedure'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'completed', 'canceled'),
      defaultValue: 'scheduled'
    },
    notes: DataTypes.TEXT,
    duration: {
      type: DataTypes.INTEGER,
      defaultValue: 30
    }
  }, {
    indexes: [
      {
        fields: ['patientId']
      },
      {
        fields: ['clinicianId']
      },
      {
        fields: ['dateTime']
      }
    ],
    timestamps: true
  });

  Appointment.associate = (models) => {
    Appointment.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      targetKey: 'patientId'
    });
    Appointment.belongsTo(models.User, {
      foreignKey: 'clinicianId',
      as: 'clinician'
    });
  };

  return Appointment;
};