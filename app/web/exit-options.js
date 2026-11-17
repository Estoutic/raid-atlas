window.ExitOptions=(()=>{
 function mode(){return state.exitMode[state.map]||'auto';}
 function indices(){return m().extracts.flatMap((ex,i)=>exitVisible(ex)&&exitAvailable(i)?[i]:[]);}
 function toggle(i,enabled){const ids=new Set(state.availableExits[state.map]??indices().map(n=>m().extracts[n].id));enabled?ids.add(m().extracts[i].id):ids.delete(m().extracts[i].id);state.availableExits[state.map]=[...ids];state.exitMode[state.map]='auto';invalidate();renderExit();}
 function refresh(){const auto=mode()==='auto';$('exitStrategy').value=mode();$('fixedExitField').hidden=auto;$('chooseAvailable').hidden=!auto;$('chooseAvailable').textContent=indices().length?'Доступно выходов: '+indices().length+' · изменить':'Отметить доступные выходы';}
 $('exitStrategy').onchange=()=>{state.exitMode[state.map]=$('exitStrategy').value;invalidate();renderExit();};$('chooseAvailable').onclick=()=>tab('exits');
 window.addEventListener('load',()=>renderExit());return {mode,indices,toggle,refresh};
})();
