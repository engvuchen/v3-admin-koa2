import{r as n,k as u,l as v,J as $,j as i,n as r,R as g,S as h,F as E,Q as G,m as M,u as y,a7 as j,a8 as N,z as A,q as J}from"./element-plus-CdAUbEXj.js";import{n as q,_ as O,o as Q,p as Z,m as H,t as K}from"./index-Cks_emWr.js";import{a as P}from"./role-BYM-Viup.js";const X=d=>q({url:"/user_role/list",method:"post",data:d}),Y=d=>q({url:"/user_role/modify",method:"post",data:d}),ee={class:"user"},te={__name:"list",setup(d){const _=n(null),V=n({labelWidth:"90px",inputWidth:"200px",fields:[{type:"text",label:"user/list.name",name:"username"}]}),L=[{label:"user/list.index",type:"index",width:80},{label:"user/list.name",prop:"username",sortable:!0},{label:"user/list.role_id",prop:"role_id",sortable:!0,tdSlot:"role"},{label:"user/list.avatar",prop:"avatar",tdSlot:"avatar"},{label:"public.operate",width:180,align:"center",tdSlot:"operate"}],T=async e=>{const t=await Q(e);if(t.code!==0)return;let l=t.data.list||[],s=await X({user_id:l.map(a=>a.id)});if(s.code!==0)return;let m=s.data.list.reduce((a,p)=>(a[p.user_id]=p.role_id,a),{});return l.forEach(a=>{a.role_id=m[a.id]||[]}),{data:l,total:t.data.total||0}},R=()=>{_.value.refresh()},F=async e=>{await Z({id:e.id}),_.value.refresh()};let b=[],x=n({});async function C(e="",{page:t,limit:l}={page:0,limit:20}){let s=await P({name:e,page:t,limit:l});return s.code!==0?void 0:s.data.list.map(a=>({label:a.name,value:a._id}))}const c=n(!1),k=n("添加"),w=n(null),U=n({labelWidth:"90px",inputWidth:"200px",fields:[{name:"id",attributes:{hide:!0},value:""},{component:"text",label:"user/list.name",name:"username",validity:[{required:!0,message:"Username Required",trigger:"blur"}]},{component:"select",label:"user/list.role_id",name:"role_id",items:[],attributes:{multiple:!0,filterable:!0,remote:!0,loading:!1},events:{"remote-method":C},validity:[{required:!0,message:"Role Required",trigger:"blur"}]}]});setTimeout(async()=>{b=await C("",{page:0,limit:1e3})||[],x=b.reduce((t,l)=>(t[l.value]=l.label,t),{});let e=U.value.fields.find(t=>t.name==="role_id");e.items=b});const I=e=>{c.value=!0,k.value="编辑";let t=A(e);J(()=>{Object.assign(w.value.formModal,t)})},W=async e=>{let t={...e.id?{id:e.id}:{},username:e.username};(await H(t)).code!==0||(await Y({user_id:t.id,role_id:e.role_id})).code!==0||(R(),K.success("成功"),c.value=!1)},S=()=>{c.value=!1};return(e,t)=>{const l=u("el-button"),s=u("el-avatar"),m=u("el-tag"),a=u("el-popconfirm"),p=u("pro-table"),z=u("pro-form"),B=u("el-dialog");return v(),$("div",ee,[i(p,{ref_key:"table",ref:_,title:e.$t("user/list.title"),request:T,columns:L,search:V.value},{toolbar:r(()=>[i(l,{icon:"Refresh",onClick:R},{default:r(()=>[g(h(e.$t("user/list.refresh")),1)]),_:1})]),avatar:r(({row:o})=>[i(s,{size:"small",fit:"cover",src:o.avatar},null,8,["src"])]),role:r(({row:o})=>[(v(!0),$(E,null,G((o==null?void 0:o.role_id)||[],(f,D)=>(v(),M(m,{key:D,type:"info",size:"small",effect:"plain",style:{"margin-right":"10px"}},{default:r(()=>[g(h(y(x)[f]||f),1)]),_:2},1024))),128))]),operate:r(o=>[i(l,{plain:"",circle:"",icon:y(j),type:"default",onClick:f=>I(o.row)},null,8,["icon","onClick"]),i(a,{width:"240","icon-color":"#626AEF","confirm-button-text":e.$t("public.confirm"),"cancel-button-text":e.$t("public.cancel"),title:e.$t("public.deleteTip"),onConfirm:f=>F(o.row)},{reference:r(()=>[i(l,{plain:"",circle:"",icon:y(N),type:"danger"},null,8,["icon"])]),_:2},1032,["confirm-button-text","cancel-button-text","title","onConfirm"])]),_:1},8,["title","search"]),i(B,{modelValue:c.value,"onUpdate:modelValue":t[0]||(t[0]=o=>c.value=o),onClose:S,class:"dialog"},{header:r(()=>[g(h(k.value),1)]),default:r(()=>[i(z,{ref_key:"proform",ref:w,config:U.value,onCancel:S,onSubmit:W},null,8,["config"])]),_:1},8,["modelValue"])])}}},re=O(te,[["__scopeId","data-v-87ac7273"]]);export{re as default};