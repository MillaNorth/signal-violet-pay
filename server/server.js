const express=require('express');
const cors=require('cors');
const app=express();
app.use(cors({origin:'*'}));
app.use(express.json());
let txs=[];
app.get('/',(req,res)=>res.json({message:'Violet Pay API 💜',version:'2.0',live:true}));
app.get('/api/health',(req,res)=>res.json({ok:true,version:'2.0',time:new Date().toISOString(),routes:['/api/pay/momo','/api/pay/flutterwave']}));
app.post('/api/pay/momo',(req,res)=>{
  const {amount,phone,provider}=req.body;
  if(!amount||!phone) return res.status(400).json({success:false,error:'amount and phone required'});
  const t={id:'MOMO_'+Date.now(),amount:Number(amount),phone,provider:provider||'mtn',status:'pending',created:new Date().toISOString(),message:`Collect ${amount} ZMW from ${phone}`};
  txs.push(t);
  console.log('MoMo payment',t);
  res.json({success:true,transaction:t});
});
app.post('/api/pay/flutterwave',(req,res)=>{
  const t={id:'FLW_'+Date.now(),amount:Number(req.body.amount),status:'initiated',provider:'flutterwave',created:new Date().toISOString()};
  txs.push(t);
  res.json({success:true,transaction:t});
});
app.get('/api/transactions',(req,res)=>res.json({count:txs.length,transactions:txs}));
const PORT=process.env.PORT||10000;
app.listen(PORT,()=>console.log('Violet v2.0 on '+PORT));
