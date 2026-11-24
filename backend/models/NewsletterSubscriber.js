import mongoose from 'mongoose'; import { modelFor } from './shared.js';
export default modelFor('NewsletterSubscriber',new mongoose.Schema({email:{type:String,required:true,unique:true,lowercase:true,trim:true},name:String,isSubscribed:{type:Boolean,default:true},confirmedAt:Date,unsubscribeToken:{type:String,unique:true,sparse:true}},{timestamps:true}));
