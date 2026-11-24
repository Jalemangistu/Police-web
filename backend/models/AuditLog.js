import mongoose from 'mongoose'; import { modelFor } from './shared.js';
export default modelFor('AuditLog',new mongoose.Schema({actor:{type:mongoose.Schema.Types.ObjectId,ref:'User'},action:{type:String,required:true},resourceType:{type:String,required:true},resourceId:String,changes:mongoose.Schema.Types.Mixed,ipAddress:String},{timestamps:{createdAt:true,updatedAt:false}}));
