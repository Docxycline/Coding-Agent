import PromptSuggetionButton from "./PromptSuggestionButton";
const PromptSuggetionsRow = ({onPromptClick}) => {
    const prompts = [
        "read this file>>",
        "fix the bug >>",
        "edit this file",
        "what are the contents causing error in this file>>",
        "list all the files in this directory>>",
        "run these commands on my local machine>>",
        "can you explain the errors in my code>>",
        "explain this code and fix errors",
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