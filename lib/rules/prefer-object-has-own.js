/**
 * @fileoverview Prefers Object.hasOwn() instead of Object.prototype.hasOwnProperty.call()
 * @author Nitin Kumar
 * @author Gautam Arora
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const astUtils = require("./utils/ast-utils");

/**
 * Checks if the given node is considered to be an access to a property of `Object.prototype`.
 * @param {ASTNode} node `MemberExpression` node to evaluate.
 * @returns {boolean} `true` if `node.object` is `Object`, `Object.prototype`, or `{}` (empty 'ObjectExpression' node).
 */
function hasLeftHandObject(node) {

    /*
     * ({}).hasOwnProperty.call(obj, prop) - `true`
     * ({ foo }.hasOwnProperty.call(obj, prop)) - `false`, object literal should be empty
     */
    if (node.object.type === "ObjectExpression" && node.object.properties.length === 0) {
        return true;
    }

    const objectNodeToCheck = node.object.type === "MemberExpression" && astUtils.getStaticPropertyName(node.object) === "prototype" ? node.object.object : node.object;

    if (objectNodeToCheck.type === "Identifier" && objectNodeToCheck.name === "Object") {
        return true;
    }

    return false;
}

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('../shared/types').Rule} */
module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description:
                "disallow use of `Object.prototype.hasOwnProperty.call()` and prefer use of `Object.hasOwn()`",
            recommended: false,
            url: "https://eslint.org/docs/rules/prefer-object-has-own"
        },
        schema: [],
        messages: {
            useHasOwn: "Use 'Object.hasOwn()' instead of 'Object.prototype.hasOwnProperty.call()'."
        },
        fixable: "code"
    },
    create(context) {
        return {
            CallExpression(node) {
                if (!(node.callee.type === "MemberExpression" && node.callee.object.type === "MemberExpression")) {
                    return;
                }

                const calleePropertyName = astUtils.getStaticPropertyName(node.callee);
                const objectPropertyName = astUtils.getStaticPropertyName(node.callee.object);
                const isObject = hasLeftHandObject(node.callee.object);

                // check `Object` scope
                const scope = context.getScope();
                const variable = astUtils.getVariableByName(scope, "Object");

                if (
                    calleePropertyName === "call" &&
                    objectPropertyName === "hasOwnProperty" &&
                    isObject &&
                    variable && variable.scope.type === "global"
                ) {
                    context.report({
                        node,
                        messageId: "useHasOwn",
                        fix(fixer) {
                            const sourceCode = context.getSourceCode();

                            if (sourceCode.getCommentsInside(node.callee).length > 0) {
                                return null;
                            }

                            return fixer.replaceText(node.callee, "Object.hasOwn");
                        }
                    });
                }
            }
        };
    }
};
