import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const MedicalRecord = sequelize.define('MedicalRecord', {
    recordId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    patientId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    recordType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    physician: DataTypes.STRING,
    attachments: DataTypes.JSON,
    status: {
      type: DataTypes.ENUM('active', 'archived'),
      defaultValue: 'active'
    }
  }, {
    indexes: [
      {
        fields: ['patientId']
      },
      {
        fields: ['recordType']
      }
    ],
    timestamps: true
  });

  MedicalRecord.associate = (models) => {
    MedicalRecord.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      targetKey: 'patientId'
    });
    MedicalRecord.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
  };

  return MedicalRecord;
};