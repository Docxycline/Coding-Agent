import PromptSuggetionButton from "./PromptSuggestionButton";
const PromptSuggetionsRow = ({onPromptClick}) => {
    const prompts = [
        "What is the best way to lose weight?",
        "What is the best way to build muscle?",
        "What is the best way to improve my sleep?",
        "What is the best way to improve my mood?",
        "What is the best way to improve my energy?",
        "What is the best way to improve my focus?",
        "What is the best way to improve my memory?",
        "What is the best way to improve my creativity?",
    ] 
    return (
        <div className="prompt-suggestion-row">
            {prompts.map((prompt, index) =>
            <PromptSuggetionButton 
            key={`suggestion-${index}`}
            text={prompt}
            onClick = {() => onPromptClick(prompt)}
            />)}
                                                                                        
        </div>
    )
}
export default PromptSuggetionsRow;